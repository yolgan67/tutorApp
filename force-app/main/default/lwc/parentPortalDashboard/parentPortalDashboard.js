import { LightningElement, track } from 'lwc';
import getParentProfile from '@salesforce/apex/PortalDataService.getParentProfile';
import getParentStudents from '@salesforce/apex/PortalDataService.getParentStudents';
import getParentStudentLessons from '@salesforce/apex/PortalDataService.getParentStudentLessons';
import getParentStudentHomeworks from '@salesforce/apex/PortalDataService.getParentStudentHomeworks';
import getParentStudentPayments from '@salesforce/apex/PortalDataService.getParentStudentPayments';
import getParentStudentExams from '@salesforce/apex/PortalDataService.getParentStudentExams';
import getOverduePaymentBreakdown from '@salesforce/apex/PortalDataService.getOverduePaymentBreakdown';
import changePassword from '@salesforce/apex/CustomAuthService.changePassword';

export default class ParentPortalDashboard extends LightningElement {
    @track isLoading = true;
    @track activeTab = 'finance';

    @track parentName = '';
    @track parentEmail = '';
    @track parentPhone = '';

    @track children = [];
    @track selectedStudent = null;
    @track hasChildren = false;

    @track lessons = [];
    @track homeworks = [];
    @track payments = [];
    @track exams = [];
    @track overdueItems = [];

    @track currentPassword = '';
    @track newPassword = '';
    @track confirmPassword = '';
    @track pwdErrorMsg = '';
    @track pwdSuccessMsg = '';

    // Tab getters
    get isFinanceActive()   { return this.activeTab === 'finance'; }
    get isLessonsActive()   { return this.activeTab === 'lessons'; }
    get isHomeworksActive() { return this.activeTab === 'homeworks'; }
    get isExamsActive()     { return this.activeTab === 'exams'; }
    get isPasswordActive()  { return this.activeTab === 'password'; }

    get sidebarFinanceClass()   { return this.activeTab === 'finance'   ? 'active' : ''; }
    get sidebarLessonsClass()   { return this.activeTab === 'lessons'   ? 'active' : ''; }
    get sidebarHomeworksClass() { return this.activeTab === 'homeworks' ? 'active' : ''; }
    get sidebarExamsClass()     { return this.activeTab === 'exams'     ? 'active' : ''; }
    get sidebarPasswordClass()  { return this.activeTab === 'password'  ? 'active' : ''; }

    get hasOverdue()    { return this.overdueItems.length > 0; }
    get overdueCount()  { return this.overdueItems.length; }

    get totalLessonFeeFormatted() {
        const v = this.selectedStudent && this.selectedStudent.Total_Lesson_Fee__c;
        return v != null ? Number(v).toFixed(2) : '0.00';
    }
    get totalPaidFormatted() {
        const v = this.selectedStudent && this.selectedStudent.Total_Paid_Amount__c;
        return v != null ? Number(v).toFixed(2) : '0.00';
    }
    get balanceFormatted() {
        const v = this.selectedStudent && this.selectedStudent.Balance__c;
        return v != null ? Number(v).toFixed(2) : '0.00';
    }

    get childrenList() {
        return this.children.map(child => ({
            ...child,
            btnClass: this.selectedStudent && this.selectedStudent.Id === child.Id
                ? 'btn-sibling active-sibling'
                : 'btn-sibling'
        }));
    }

    get lessonsWithNotes() {
        return this.lessons.filter(l => l.Lesson_Notes__c && l.Status__c === 'Completed');
    }

    async connectedCallback() {
        await this.loadParentProfile();
    }

    async loadParentProfile() {
        this.isLoading = true;
        const token = localStorage.getItem('sessionToken');
        try {
            const parent = await getParentProfile({ sessionToken: token });
            this.parentName  = parent.Name;
            this.parentEmail = parent.Email__c;
            this.parentPhone = parent.Phone__c || 'Girilmemiş';

            this.children = await getParentStudents({ sessionToken: token });
            this.hasChildren = this.children.length > 0;

            if (this.hasChildren) {
                this.selectedStudent = this.children[0];
                await this.loadSelectedStudentData();
            }
        } catch (error) {
            this.handleAuthError(error);
        } finally {
            this.isLoading = false;
        }
    }

    async loadSelectedStudentData() {
        if (!this.selectedStudent) return;
        const token     = localStorage.getItem('sessionToken');
        const studentId = this.selectedStudent.Id;

        try {
            // Lessons
            const rawLessons = await getParentStudentLessons({ sessionToken: token, studentId });
            this.lessons = rawLessons.map(l => ({
                ...l,
                dateTimeStr: new Date(l.Date_Time__c).toLocaleDateString('tr-TR', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' }),
                dateShort: new Date(l.Date_Time__c).toLocaleDateString('tr-TR', { day:'numeric', month:'short' }),
                feeFormatted: l.Total_Fee__c != null ? Number(l.Total_Fee__c).toFixed(2) : '0.00'
            }));

            // Homeworks
            const rawHW = await getParentStudentHomeworks({ sessionToken: token, studentId });
            this.homeworks = rawHW.map(hw => ({
                ...hw,
                dueDateStr: new Date(hw.Due_Date__c).toLocaleDateString('tr-TR', { day:'numeric', month:'long', year:'numeric' }),
                isGraded: hw.Status__c === 'Completed' || hw.Status__c === 'Incomplete',
                badgeClass: hw.Status__c === 'Submitted'  ? 'badge-hw submitted'  :
                            hw.Status__c === 'Completed'  ? 'badge-hw completed'  :
                            hw.Status__c === 'Incomplete' ? 'badge-hw incomplete' : 'badge-hw assigned',
                statusText: hw.Status__c === 'Submitted'  ? 'Teslim Edildi'  :
                            hw.Status__c === 'Completed'  ? 'Tamamlandı'     :
                            hw.Status__c === 'Incomplete' ? 'Eksik Yapıldı'  : 'Ödev Verildi'
            }));

            // Payments
            const rawPay = await getParentStudentPayments({ sessionToken: token, studentId });
            this.payments = rawPay.map(p => ({
                ...p,
                paymentDateStr: new Date(p.Payment_Date__c).toLocaleDateString('tr-TR', { day:'numeric', month:'long', year:'numeric' }),
                amountFormatted: p.Amount__c != null ? Number(p.Amount__c).toFixed(2) : '0.00'
            }));

            // Exams
            const rawExams = await getParentStudentExams({ sessionToken: token, studentId });
            this.exams = rawExams.map(ex => {
                const tNet = ex.Total_Net__c || 0;
                const mNet = ex.Math_Net__c  || 0;
                const tQ   = ex.Total_Questions__c > 0 ? ex.Total_Questions__c : 100;
                return {
                    ...ex,
                    examDateStr: new Date(ex.Date__c).toLocaleDateString('tr-TR', { day:'numeric', month:'long', year:'numeric' }),
                    totalNetFormatted: tNet.toFixed(2),
                    mathNetFormatted:  mNet.toFixed(2),
                    totalNetStyle: `width: ${Math.min(100, (tNet * 100 / tQ)).toFixed(0)}%`,
                    mathNetStyle:  `width: ${Math.min(100, (mNet * 100 / tQ)).toFixed(0)}%`
                };
            });

            // Overdue breakdown
            const rawOverdue = await getOverduePaymentBreakdown({ sessionToken: token, studentId });
            this.overdueItems = rawOverdue.map(item => {
                const days = Number(item.daysOverdue || 0);
                return {
                    ...item,
                    dateStr: item.dateTimeISO
                        ? new Date(item.dateTimeISO).toLocaleDateString('tr-TR', { day:'numeric', month:'long', year:'numeric' })
                        : '',
                    feeFormatted: item.Total_Fee__c != null ? Number(item.Total_Fee__c).toFixed(2) : '0.00',
                    delayLabel: days <= 7   ? `${days} gün gecikmiş`  :
                                days <= 30  ? `${Math.floor(days/7)} hafta gecikmiş`  :
                                              `${Math.floor(days/30)} ay gecikmiş`,
                    delayClass: days > 30 ? 'delay-badge danger' :
                                days > 7  ? 'delay-badge warning' : 'delay-badge mild'
                };
            });

        } catch (error) {
            this.handleAuthError(error);
        }
    }

    async handleSiblingChange(event) {
        const studentId = event.currentTarget.dataset.id;
        const target = this.children.find(c => c.Id === studentId);
        if (target && this.selectedStudent.Id !== studentId) {
            this.isLoading = true;
            this.selectedStudent = target;
            await this.loadSelectedStudentData();
            this.isLoading = false;
        }
    }

    handleTabClick(event) {
        event.preventDefault();
        this.activeTab = event.currentTarget.dataset.tab;
        this.pwdErrorMsg = '';
        this.pwdSuccessMsg = '';
    }

    handleCurPwd(e) { this.currentPassword = e.target.value; this.pwdErrorMsg = ''; }
    handleNewPwd(e) { this.newPassword = e.target.value;     this.pwdErrorMsg = ''; }
    handleConfPwd(e){ this.confirmPassword = e.target.value; this.pwdErrorMsg = ''; }

    async handlePasswordSubmit(event) {
        event.preventDefault();
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
        try {
            await changePassword({
                sessionToken: localStorage.getItem('sessionToken'),
                role: 'parent',
                currentPassword: this.currentPassword,
                newPassword: this.newPassword
            });
            this.pwdSuccessMsg = 'Şifreniz başarıyla güncellendi!';
            this.currentPassword = this.newPassword = this.confirmPassword = '';
        } catch (error) {
            this.pwdErrorMsg = error.body ? error.body.message : 'Şifre güncellenirken hata oluştu.';
        } finally {
            this.isLoading = false;
        }
    }

    handleAuthError(error) {
        const msg = error.body ? error.body.message : '';
        if (msg && msg.includes('doldu')) {
            localStorage.removeItem('sessionToken');
            localStorage.removeItem('sessionRole');
            this.dispatchEvent(new CustomEvent('logout'));
        }
    }

    handleLogout() {
        this.dispatchEvent(new CustomEvent('logout'));
    }
}
