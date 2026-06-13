import { LightningElement, track } from 'lwc';
import getParentProfile from '@salesforce/apex/PortalDataService.getParentProfile';
import getParentStudents from '@salesforce/apex/PortalDataService.getParentStudents';
import getParentStudentLessons from '@salesforce/apex/PortalDataService.getParentStudentLessons';
import getParentStudentHomeworks from '@salesforce/apex/PortalDataService.getParentStudentHomeworks';
import getParentStudentPayments from '@salesforce/apex/PortalDataService.getParentStudentPayments';
import getParentStudentExams from '@salesforce/apex/PortalDataService.getParentStudentExams';
import changePassword from '@salesforce/apex/CustomAuthService.changePassword';

export default class ParentPortalDashboard extends LightningElement {
    @track isLoading = true;
    @track activeTab = 'lessons'; // 'lessons', 'homeworks', 'exams', 'payments', 'password'
    
    // Parent Profile Details
    @track parentName = '';
    @track parentEmail = '';
    @track parentPhone = '';

    // Sibling (Children) State
    @track children = [];
    @track selectedStudent = null;
    @track hasChildren = false;

    // Active Child Metrics & Records
    @track lessons = [];
    @track homeworks = [];
    @track payments = [];
    @track exams = [];
    @track totalExamsCount = 0;
    
    @track currentPassword = '';
    @track newPassword = '';
    @track confirmPassword = '';
    @track pwdErrorMsg = '';
    @track pwdSuccessMsg = '';

    // Navigation Tab Getters
    get isLessonsActive() { return this.activeTab === 'lessons'; }
    get isHomeworksActive() { return this.activeTab === 'homeworks'; }
    get isExamsActive() { return this.activeTab === 'exams'; }
    get isPaymentsActive() { return this.activeTab === 'payments'; }
    get isPasswordActive() { return this.activeTab === 'password'; }

    get sidebarLessonsClass() { return this.activeTab === 'lessons' ? 'active' : ''; }
    get sidebarHomeworksClass() { return this.activeTab === 'homeworks' ? 'active' : ''; }
    get sidebarExamsClass() { return this.activeTab === 'exams' ? 'active' : ''; }
    get sidebarPaymentsClass() { return this.activeTab === 'payments' ? 'active' : ''; }
    get sidebarPasswordClass() { return this.activeTab === 'password' ? 'active' : ''; }

    // Sibling switching selector styling
    get childrenList() {
        return this.children.map(child => {
            const isSelected = this.selectedStudent && this.selectedStudent.Id === child.Id;
            return {
                ...child,
                btnClass: isSelected ? 'btn-sibling active-sibling' : 'btn-sibling'
            };
        });
    }

    async connectedCallback() {
        await this.loadParentProfile();
    }

    // Load initial profile and sibling list
    async loadParentProfile() {
        this.isLoading = true;
        const token = localStorage.getItem('sessionToken');
        
        try {
            // Fetch Parent Profile Info
            const parent = await getParentProfile({ sessionToken: token });
            this.parentName = parent.Name;
            this.parentEmail = parent.Email__c;
            this.parentPhone = parent.Phone__c || 'Girilmemiş';

            // Fetch Sibling List
            this.children = await getParentStudents({ sessionToken: token });
            this.hasChildren = this.children.length > 0;
            
            if (this.hasChildren) {
                // Select first child by default
                this.selectedStudent = this.children[0];
                await this.loadSelectedStudentData();
            }
        } catch (error) {
            console.error('Error loading parent profile', error);
            if (error.body && error.body.message && error.body.message.includes('Unauthorized')) {
                this.handleLogout();
            }
        } finally {
            this.isLoading = false;
        }
    }

    // Load data for currently selected child
    async loadSelectedStudentData() {
        if (!this.selectedStudent) return;
        
        const token = localStorage.getItem('sessionToken');
        const studentId = this.selectedStudent.Id;
        
        try {
            // 1. Load Lessons (with pricing)
            const rawLessons = await getParentStudentLessons({ sessionToken: token, studentId: studentId });
            this.lessons = rawLessons.map(l => {
                const lDate = new Date(l.Date_Time__c);
                return {
                    ...l,
                    dateTimeStr: lDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                    rateFormatted: l.Hourly_Rate__c != null ? l.Hourly_Rate__c.toFixed(2) : '0.00',
                    feeFormatted: l.Total_Fee__c != null ? l.Total_Fee__c.toFixed(2) : '0.00'
                };
            });

            // 2. Load Homeworks (with solution details and comment metrics)
            const rawHomeworks = await getParentStudentHomeworks({ sessionToken: token, studentId: studentId });
            this.homeworks = rawHomeworks.map(hw => {
                const dueDateObj = new Date(hw.Due_Date__c);
                return {
                    ...hw,
                    dueDateStr: dueDateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
                    isPending: hw.Status__c === 'Assigned' || hw.Status__c === 'In Progress',
                    isSubmitted: hw.Status__c === 'Submitted',
                    isGraded: hw.Status__c === 'Completed' || hw.Status__c === 'Incomplete',
                    badgeClass: hw.Status__c === 'Submitted' ? 'badge-submitted' : 
                                hw.Status__c === 'Completed' ? 'badge-completed' : 
                                hw.Status__c === 'Incomplete' ? 'badge-incomplete' : 'badge-assigned',
                    statusText: hw.Status__c === 'Submitted' ? 'Teslim Edildi' : 
                                hw.Status__c === 'Completed' ? 'Tamamlandı' : 
                                hw.Status__c === 'Incomplete' ? 'Eksik Yapıldı' : 'Ödev Verildi'
                };
            });

            // 3. Load Payments
            const rawPayments = await getParentStudentPayments({ sessionToken: token, studentId: studentId });
            this.payments = rawPayments.map(p => {
                const payDate = new Date(p.Payment_Date__c);
                return {
                    ...p,
                    paymentDateStr: payDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
                    amountFormatted: p.Amount__c != null ? p.Amount__c.toFixed(2) : '0.00'
                };
            });

            // 4. Load Exams (with dynamic formula nets and comments)
            const rawExams = await getParentStudentExams({ sessionToken: token, studentId: studentId });
            this.exams = rawExams.map(ex => {
                const exDate = new Date(ex.Date__c);
                const tNet = ex.Total_Net__c != null ? ex.Total_Net__c : 0;
                const mNet = ex.Math_Net__c != null ? ex.Math_Net__c : 0;
                const tQ = ex.Total_Questions__c != null && ex.Total_Questions__c > 0 ? ex.Total_Questions__c : 100;
                
                // Calculate percentage out of total questions (clamp between 0 and 100)
                const tNetPct = Math.max(0, Math.min(100, (tNet * 100 / tQ))).toFixed(0);
                const mNetPct = Math.max(0, Math.min(100, (mNet * 100 / tQ))).toFixed(0);
                
                return {
                    ...ex,
                    examDateStr: exDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
                    totalNetFormatted: ex.Total_Net__c != null ? ex.Total_Net__c.toFixed(2) : '0.00',
                    mathNetFormatted: ex.Math_Net__c != null ? ex.Math_Net__c.toFixed(2) : '0.00',
                    totalNetStyle: `width: ${tNetPct}%;`,
                    mathNetStyle: `width: ${mNetPct}%;`
                };
            });
            this.totalExamsCount = this.exams.length;

        } catch (error) {
            console.error('Error loading student details', error);
        }
    }

    // Switch active child (sibling switching)
    async handleSiblingChange(event) {
        const studentId = event.currentTarget.dataset.id;
        const targetChild = this.children.find(c => c.Id === studentId);
        
        if (targetChild && this.selectedStudent.Id !== studentId) {
            this.isLoading = true;
            this.selectedStudent = targetChild;
            await this.loadSelectedStudentData();
            this.isLoading = false;
        }
    }

    // Tab switcher
    handleTabClick(event) {
        event.preventDefault();
        this.activeTab = event.currentTarget.dataset.tab;
        this.pwdErrorMsg = '';
        this.pwdSuccessMsg = '';
    }

    // Secure Parent Password Update
    handleCurPwd(event) { this.currentPassword = event.target.value; this.pwdErrorMsg = ''; }
    handleNewPwd(event) { this.newPassword = event.target.value; this.pwdErrorMsg = ''; }
    handleConfPwd(event) { this.confirmPassword = event.target.value; this.pwdErrorMsg = ''; }

    async handlePasswordSubmit(event) {
        event.preventDefault();
        const token = localStorage.getItem('sessionToken');

        if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
            this.pwdErrorMsg = 'Lütfen tüm alanları doldurun.';
            return;
        }
        if (this.newPassword !== this.confirmPassword) {
            this.pwdErrorMsg = 'Yeni şifreler eşleşmiyor.';
            return;
        }
        if (this.newPassword.length < 6) {
            this.pwdErrorMsg = 'Yeni şifreniz en az 6 karakter olmalıdır.';
            return;
        }

        this.isLoading = true;
        this.pwdErrorMsg = '';
        this.pwdSuccessMsg = '';

        try {
            await changePassword({
                sessionToken: token,
                role: 'parent',
                currentPassword: this.currentPassword,
                newPassword: this.newPassword
            });
            this.pwdSuccessMsg = 'Şifreniz başarıyla güncellendi!';
            this.currentPassword = '';
            this.newPassword = '';
            this.confirmPassword = '';
        } catch (error) {
            this.pwdErrorMsg = error.body ? error.body.message : 'Şifre güncellenirken hata oluştu.';
        } finally {
            this.isLoading = false;
        }
    }

    handleLogout() {
        const logoutEvent = new CustomEvent('logout');
        this.dispatchEvent(logoutEvent);
    }
}
