import { LightningElement, track } from 'lwc';
import getAllStudents from '@salesforce/apex/TutorPortalDataService.getAllStudents';
import getStudentDetails from '@salesforce/apex/TutorPortalDataService.getStudentDetails';
import getTodayLessons from '@salesforce/apex/TutorPortalDataService.getTodayLessons';
import addHomework from '@salesforce/apex/TutorPortalDataService.addHomework';
import addPayment from '@salesforce/apex/TutorPortalDataService.addPayment';
import gradeHomework from '@salesforce/apex/TutorPortalDataService.gradeHomework';

export default class TutorPortalDashboard extends LightningElement {
    @track currentTab = 'calendar';
    @track isLoading = false;
    @track students = [];
    @track selectedStudent = null;
    @track studentDetails = {};
    @track todayLessons = [];

    // Modals
    @track isHomeworkModalOpen = false;
    @track isPaymentModalOpen = false;
    @track isGradeModalOpen = false;

    @track newHomework = {};
    @track newPayment = {};

    @track selectedHomeworkForGrading = null;
    @track hwGrade = '';
    @track hwTeacherComment = '';
    @track hwGradeStatus = 'Completed';
    @track modalErrorMsg = '';

    get isCalendarTab() { return this.currentTab === 'calendar'; }
    get calendarTabClass() { return this.isCalendarTab ? 'tab-btn active' : 'tab-btn'; }

    get isStudentsTab() { return this.currentTab === 'students'; }
    get studentsTabClass() { return this.isStudentsTab ? 'tab-btn active' : 'tab-btn'; }

    get hasTodayLessons() { return this.todayLessons.length > 0; }
    get todayDateStr() {
        return new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    connectedCallback() {
        this.fetchStudents();
        this.fetchTodayLessons();
    }

    selectCalendarTab() { this.currentTab = 'calendar'; }
    selectStudentsTab() {
        this.currentTab = 'students';
        this.selectedStudent = null;
    }

    async fetchTodayLessons() {
        const token = localStorage.getItem('sessionToken');
        try {
            const raw = await getTodayLessons({ token });
            this.todayLessons = raw.map(l => {
                const dt = new Date(l.Date_Time__c);
                let statusClass = 'today-badge scheduled';
                if (l.Status__c === 'Completed') statusClass = 'today-badge completed';
                else if (l.Status__c && l.Status__c.includes('Cancel')) statusClass = 'today-badge canceled';
                return {
                    ...l,
                    timeStr: dt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                    studentName: l.Student__r
                        ? `${l.Student__r.First_Name__c} ${l.Student__r.Last_Name__c}`
                        : 'Öğrenci',
                    statusClass
                };
            }).sort((a, b) => new Date(a.Date_Time__c) - new Date(b.Date_Time__c));
        } catch (error) {
            this.handleError(error, 'Günlük ders listesi alınamadı');
        }
    }

    async fetchStudents() {
        this.isLoading = true;
        const token = localStorage.getItem('sessionToken');
        try {
            this.students = await getAllStudents({ token });
        } catch (error) {
            this.handleError(error, 'Öğrenci listesi alınamadı');
        } finally {
            this.isLoading = false;
        }
    }

    handleError(error, customMsg) {
        console.error(customMsg, error);
        const msg = error.body ? error.body.message : error.message;
        if (msg && (msg.includes('doldu') || msg.includes('Unauthorized'))) {
            localStorage.removeItem('sessionToken');
            localStorage.removeItem('sessionRole');
            this.dispatchEvent(new CustomEvent('logout'));
        }
    }

    async handleStudentClick(event) {
        const studentId = event.currentTarget.dataset.id;
        await this.loadStudentDataById(studentId);
    }

    async loadStudentDataById(studentId) {
        this.isLoading = true;
        const token = localStorage.getItem('sessionToken');
        try {
            const data = await getStudentDetails({ token, studentId });
            this.selectedStudent = data.student;

            let regDateFormatted = 'Belirtilmemiş';
            if (data.student.Registration_Date__c) {
                regDateFormatted = new Date(data.student.Registration_Date__c)
                    .toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
            }

            this.studentDetails = {
                regDate: regDateFormatted,
                parentName:  data.student.Parent__r ? data.student.Parent__r.Name             : 'Kayıtlı Veli Yok',
                parentPhone: data.student.Parent__r ? (data.student.Parent__r.Phone__c || 'Telefon Yok') : 'Telefon Yok',
                parentEmail: data.student.Parent__r ? (data.student.Parent__r.Email__c || 'E-posta Yok') : 'E-posta Yok',
                pastLessons:   this.formatLessons(data.pastLessons),
                futureLessons: this.formatLessons(data.futureLessons),
                payments:  this.formatPayments(data.payments),
                homeworks: this.formatHomework(data.homeworks),
                exams:     this.formatExams(data.exams)
            };
        } catch (error) {
            this.handleError(error, 'Öğrenci detayları alınamadı');
        } finally {
            this.isLoading = false;
        }
    }

    handleBackToList() {
        this.selectedStudent = null;
        this.fetchStudents();
    }

    openHomeworkModal() {
        this.newHomework = {
            Student__c: this.selectedStudent.Id,
            Status__c: 'Assigned',
            Due_Date__c: new Date().toISOString().split('T')[0]
        };
        this.isHomeworkModalOpen = true;
    }

    openPaymentModal() {
        this.newPayment = {
            Student__c: this.selectedStudent.Id,
            Payment_Method__c: 'Cash',
            Payment_Date__c: new Date().toISOString().split('T')[0]
        };
        this.isPaymentModalOpen = true;
    }

    openGradeModal(event) {
        const homeworkId = event.target.dataset.id;
        const hw = (this.studentDetails.homeworks || []).find(h => h.Id === homeworkId);
        this.selectedHomeworkForGrading = hw;
        // Pre-fill if already graded so teacher can update
        this.hwGrade = hw && hw.Grade__c != null ? hw.Grade__c : '';
        this.hwTeacherComment = hw && hw.Teacher_Comment__c ? hw.Teacher_Comment__c : '';
        this.hwGradeStatus = hw && hw.Status__c === 'Incomplete' ? 'Incomplete' : 'Completed';
        this.modalErrorMsg = '';
        this.isGradeModalOpen = true;
    }

    get gradeModalTitle() {
        if (this.selectedHomeworkForGrading && this.selectedHomeworkForGrading.isGraded) {
            return '✏️ Değerlendirmeyi Güncelle';
        }
        return '✏️ Ödevi Değerlendir';
    }

    closeModals() {
        this.isHomeworkModalOpen = false;
        this.isPaymentModalOpen = false;
        this.isGradeModalOpen = false;
        this.selectedHomeworkForGrading = null;
    }

    handleHomeworkChange(e) { this.newHomework[e.target.dataset.field] = e.target.value; }
    handlePaymentChange(e)  { this.newPayment[e.target.dataset.field]  = e.target.value; }
    handleGradeChange(e)         { this.hwGrade = e.target.value; }
    handleGradeCommentChange(e)  { this.hwTeacherComment = e.target.value; }
    handleGradeStatusChange(e)   { this.hwGradeStatus = e.target.value; }

    async saveHomework() {
        this.isLoading = true;
        try {
            const token = localStorage.getItem('sessionToken');
            await addHomework({ token, homeworkData: { ...this.newHomework, sobjectType: 'Homework__c' } });
            this.closeModals();
            await this.loadStudentDataById(this.selectedStudent.Id);
        } catch (error) {
            this.handleError(error, 'Ödev eklenemedi');
        } finally {
            this.isLoading = false;
        }
    }

    async savePayment() {
        this.isLoading = true;
        try {
            const token = localStorage.getItem('sessionToken');
            await addPayment({ token, paymentData: { ...this.newPayment, sobjectType: 'Payment__c' } });
            this.closeModals();
            await this.loadStudentDataById(this.selectedStudent.Id);
        } catch (error) {
            this.handleError(error, 'Ödeme eklenemedi');
        } finally {
            this.isLoading = false;
        }
    }

    async saveGrade(event) {
        event.preventDefault();
        const gradeVal = parseInt(this.hwGrade, 10);
        if (isNaN(gradeVal) || gradeVal < 0 || gradeVal > 100) {
            this.modalErrorMsg = 'Lütfen 0 ile 100 arasında geçerli bir puan girin.';
            return;
        }
        this.isLoading = true;
        this.modalErrorMsg = '';
        try {
            const token = localStorage.getItem('sessionToken');
            await gradeHomework({
                token,
                homeworkId: this.selectedHomeworkForGrading.Id,
                status: this.hwGradeStatus,
                grade: gradeVal,
                comment: this.hwTeacherComment
            });
            this.closeModals();
            await this.loadStudentDataById(this.selectedStudent.Id);
        } catch (error) {
            this.modalErrorMsg = error.body ? error.body.message : 'Ödev değerlendirilemedi.';
        } finally {
            this.isLoading = false;
        }
    }

    handleLogout() {
        this.dispatchEvent(new CustomEvent('logout'));
    }

    // Formatters
    formatLessons(lessons) {
        if (!lessons) return [];
        return lessons.map(l => ({
            ...l,
            Date_Time__c: new Date(l.Date_Time__c).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
            feeFormatted: l.Total_Fee__c != null ? l.Total_Fee__c.toFixed(2) : '0.00'
        }));
    }

    formatPayments(payments) {
        if (!payments) return [];
        return payments.map(p => ({
            ...p,
            Payment_Date__c: new Date(p.Payment_Date__c).toLocaleDateString('tr-TR'),
            amountFormatted: p.Amount__c != null ? p.Amount__c.toFixed(2) : '0.00'
        }));
    }

    formatHomework(homeworks) {
        if (!homeworks) return [];
        return homeworks.map(h => {
            const isGraded = h.Status__c === 'Completed' || h.Status__c === 'Incomplete';
            return {
                ...h,
                Due_Date__c: new Date(h.Due_Date__c).toLocaleDateString('tr-TR'),
                isSubmitted: h.Status__c === 'Submitted',
                isGraded: isGraded,
                isGradeable: h.Status__c === 'Submitted' || isGraded,
                gradeButtonText: isGraded ? '✏️ Güncelle' : '✏️ Değerlendir',
                badgeClass: h.Status__c === 'Submitted'  ? 'badge-hw submitted'  :
                            h.Status__c === 'Completed'  ? 'badge-hw completed'  :
                            h.Status__c === 'Incomplete' ? 'badge-hw incomplete' : 'badge-hw assigned',
                statusText: h.Status__c === 'Submitted'  ? 'Gönderildi'  :
                            h.Status__c === 'Completed'  ? 'Tamamlandı'  :
                            h.Status__c === 'Incomplete' ? 'Eksik Yapıldı' : 'Ödev Verildi'
            };
        });
    }

    formatExams(exams) {
        if (!exams) return [];
        return exams.map(e => ({
            ...e,
            Date__c: new Date(e.Date__c).toLocaleDateString('tr-TR'),
            totalNetFormatted: e.Total_Net__c != null ? e.Total_Net__c.toFixed(2) : '0.00',
            mathNetFormatted:  e.Math_Net__c  != null ? e.Math_Net__c.toFixed(2)  : '0.00'
        }));
    }

    stopPropagation(event) { event.stopPropagation(); }
}
