import { LightningElement, track } from 'lwc';
import getStudentProfile from '@salesforce/apex/PortalDataService.getStudentProfile';
import getLessons from '@salesforce/apex/PortalDataService.getLessons';
import getHomeworks from '@salesforce/apex/PortalDataService.getHomeworks';
import getExams from '@salesforce/apex/PortalDataService.getExams';
import submitHomework from '@salesforce/apex/PortalDataService.submitHomework';
import submitPracticeExam from '@salesforce/apex/PortalDataService.submitPracticeExam';
import changePassword from '@salesforce/apex/CustomAuthService.changePassword';

export default class PortalDashboard extends LightningElement {
    @track isLoading = true;
    @track activeTab = 'summary';

    @track studentName = '';
    @track studentGrade = '';
    @track studentSchool = '';
    @track studentRegDate = '';
    @track studentType = '';
    @track targetExamDate = null;

    @track nextLessonDate = 'Yok';
    @track nextLessonBranch = '';
    @track pendingHomeworkCount = 0;

    @track lessons = [];
    @track allLessons = [];
    @track homeworks = [];
    @track exams = [];

    @track showHomeworkModal = false;
    @track activeHomework = null;
    @track hwCompletedQuestions = '';
    @track hwCorrects = '';
    @track hwWrongs = '';
    @track hwComment = '';

    @track showExamModal = false;
    @track examTitle = '';
    @track examDate = '';
    @track examTotalQuestions = '';
    @track examTotalCorrect = '';
    @track examTotalWrong = '';
    @track examMathCorrect = '';
    @track examMathWrong = '';

    @track currentPassword = '';
    @track newPassword = '';
    @track confirmPassword = '';
    @track pwdErrorMsg = '';
    @track pwdSuccessMsg = '';
    @track modalErrorMsg = '';

    get isSummaryActive()   { return this.activeTab === 'summary'; }
    get isLessonsActive()   { return this.activeTab === 'lessons'; }
    get isHomeworksActive() { return this.activeTab === 'homeworks'; }
    get isExamsActive()     { return this.activeTab === 'exams'; }
    get isPasswordActive()  { return this.activeTab === 'password'; }

    get sidebarSummaryClass()   { return this.activeTab === 'summary'   ? 'active' : ''; }
    get sidebarLessonsClass()   { return this.activeTab === 'lessons'   ? 'active' : ''; }
    get sidebarHomeworksClass() { return this.activeTab === 'homeworks' ? 'active' : ''; }
    get sidebarExamsClass()     { return this.activeTab === 'exams'     ? 'active' : ''; }
    get sidebarPasswordClass()  { return this.activeTab === 'password'  ? 'active' : ''; }

    // Countdown: only for TYT/AYT and LGS students with a set exam date
    get showExamCountdown() {
        return (this.studentType === 'TYT/AYT Hazırlık' || this.studentType === 'LGS Hazırlık')
            && this.targetExamDate != null;
    }

    get examCountdownDays() {
        if (!this.targetExamDate) return 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(this.targetExamDate);
        target.setHours(0, 0, 0, 0);
        return Math.max(0, Math.round((target - today) / 86400000));
    }

    get examCountdownLabel() {
        if (this.studentType === 'TYT/AYT Hazırlık') return 'TYT/AYT\'e Kalan Süre';
        if (this.studentType === 'LGS Hazırlık')    return 'LGS\'e Kalan Süre';
        return 'Sınava Kalan Süre';
    }

    get examCountdownClass() {
        const days = this.examCountdownDays;
        return days <= 30 ? 'countdown-card glass-card urgent' :
               days <= 90 ? 'countdown-card glass-card soon'   : 'countdown-card glass-card';
    }

    async connectedCallback() {
        this.examDate = new Date().toISOString().split('T')[0];
        await this.loadDashboardData();
    }

    async loadDashboardData() {
        this.isLoading = true;
        const token = localStorage.getItem('sessionToken');
        try {
            const profile = await getStudentProfile({ sessionToken: token });
            this.studentName   = profile.Name;
            this.studentGrade  = profile.Grade__c  || 'Belirtilmemiş';
            this.studentSchool = profile.School__c || 'Belirtilmemiş';
            this.studentType   = profile.Student_Type__c || '';
            this.targetExamDate = profile.Target_Exam_Date__c || null;

            if (profile.Registration_Date__c) {
                this.studentRegDate = new Date(profile.Registration_Date__c)
                    .toLocaleDateString('tr-TR', { day:'numeric', month:'long', year:'numeric' });
            } else {
                this.studentRegDate = 'Belirtilmemiş';
            }

            const rawLessons = await getLessons({ sessionToken: token });
            this.allLessons = rawLessons;
            const upcoming = rawLessons
                .filter(l => l.Status__c === 'Scheduled')
                .sort((a, b) => new Date(a.Date_Time__c) - new Date(b.Date_Time__c));

            if (upcoming.length > 0) {
                const next = upcoming[0];
                const dt = new Date(next.Date_Time__c);
                this.nextLessonDate   = dt.toLocaleDateString('tr-TR', { day:'numeric', month:'long', hour:'2-digit', minute:'2-digit' });
                this.nextLessonBranch = next.Branch__c || 'Ders';
                this.lessons = upcoming.slice(0, 5).map(l => {
                    const d = new Date(l.Date_Time__c);
                    return {
                        ...l,
                        dateStr:  d.toLocaleDateString('tr-TR', { day:'numeric', month:'long', year:'numeric' }),
                        timeStr:  d.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' }),
                        dayStr:   d.toLocaleDateString('tr-TR', { day:'2-digit' }),
                        monthStr: d.toLocaleDateString('tr-TR', { month:'short' })
                    };
                });
            } else {
                this.nextLessonDate = 'Yaklaşan ders yok';
                this.nextLessonBranch = '';
                this.lessons = [];
            }

            const rawHW = await getHomeworks({ sessionToken: token });
            this.pendingHomeworkCount = rawHW.filter(hw => hw.Status__c === 'Assigned' || hw.Status__c === 'In Progress').length;
            this.homeworks = rawHW.map(hw => {
                const due = new Date(hw.Due_Date__c);
                const isOverdue = due < new Date() && (hw.Status__c === 'Assigned' || hw.Status__c === 'In Progress');
                return {
                    ...hw,
                    dueDateStr: due.toLocaleDateString('tr-TR', { day:'numeric', month:'long', year:'numeric' }),
                    isPending:  hw.Status__c === 'Assigned' || hw.Status__c === 'In Progress',
                    isSubmitted: hw.Status__c === 'Submitted',
                    isGraded:   hw.Status__c === 'Completed' || hw.Status__c === 'Incomplete',
                    isOverdue,
                    badgeClass: hw.Status__c === 'Submitted'  ? 'badge-hw submitted'  :
                                hw.Status__c === 'Completed'  ? 'badge-hw completed'  :
                                hw.Status__c === 'Incomplete' ? 'badge-hw incomplete' : 'badge-hw assigned',
                    statusText: hw.Status__c === 'Submitted'  ? 'Teslim Edildi' :
                                hw.Status__c === 'Completed'  ? 'Tamamlandı'    :
                                hw.Status__c === 'Incomplete' ? 'Eksik Yapıldı' : 'Ödev Verildi'
                };
            });

            const rawExams = await getExams({ sessionToken: token });
            this.exams = rawExams.map(ex => ({
                ...ex,
                examDateStr:       new Date(ex.Date__c).toLocaleDateString('tr-TR', { day:'numeric', month:'long', year:'numeric' }),
                totalNetFormatted: ex.Total_Net__c != null ? ex.Total_Net__c.toFixed(2) : '0.00',
                mathNetFormatted:  ex.Math_Net__c  != null ? ex.Math_Net__c.toFixed(2)  : '0.00'
            }));

        } catch (error) {
            this.handleAuthError(error);
        } finally {
            this.isLoading = false;
        }
    }

    handleAuthError(error) {
        const msg = (error.body && error.body.message) ? error.body.message : '';
        if (msg.includes('doldu') || msg.includes('Unauthorized')) {
            localStorage.removeItem('sessionToken');
            localStorage.removeItem('sessionRole');
            this.dispatchEvent(new CustomEvent('logout'));
        }
    }

    handleTabClick(event) {
        event.preventDefault();
        this.activeTab = event.currentTarget.dataset.tab;
        this.pwdErrorMsg = this.pwdSuccessMsg = this.modalErrorMsg = '';
    }

    openSubmitHomework(event) {
        const id = event.target.dataset.id;
        this.activeHomework = this.homeworks.find(hw => hw.Id === id);
        this.hwCompletedQuestions = this.hwCorrects = this.hwWrongs = this.hwComment = '';
        this.modalErrorMsg = '';
        this.showHomeworkModal = true;
    }
    closeHomeworkModal() { this.showHomeworkModal = false; this.activeHomework = null; }

    handleHwCompletedChange(e) { this.hwCompletedQuestions = e.target.value; }
    handleHwCorrectsChange(e)  { this.hwCorrects = e.target.value; }
    handleHwWrongsChange(e)    { this.hwWrongs = e.target.value; }
    handleHwCommentChange(e)   { this.hwComment = e.target.value; }

    async handleHomeworkSubmit(event) {
        event.preventDefault();
        const completedVal = parseInt(this.hwCompletedQuestions, 10);
        const correctVal   = parseInt(this.hwCorrects, 10);
        const wrongVal     = parseInt(this.hwWrongs, 10);
        if (isNaN(completedVal) || isNaN(correctVal) || isNaN(wrongVal)) {
            this.modalErrorMsg = 'Lütfen tüm soru sayısı alanlarını doldurun.';
            return;
        }
        if (correctVal + wrongVal > completedVal) {
            this.modalErrorMsg = 'Doğru ve yanlış toplamı, çözülen soru sayısını aşamaz.';
            return;
        }
        this.isLoading = true;
        this.modalErrorMsg = '';
        try {
            await submitHomework({
                sessionToken: localStorage.getItem('sessionToken'),
                homeworkId: this.activeHomework.Id,
                completedQuestions: completedVal,
                corrects: correctVal,
                wrongs: wrongVal,
                comment: this.hwComment
            });
            this.showHomeworkModal = false;
            await this.loadDashboardData();
        } catch (error) {
            this.modalErrorMsg = error.body ? error.body.message : 'Ödev gönderilirken hata oluştu.';
        } finally {
            this.isLoading = false;
        }
    }

    openAddExam() {
        this.examTitle = '';
        this.examDate = new Date().toISOString().split('T')[0];
        this.examTotalQuestions = this.examTotalCorrect = this.examTotalWrong = '';
        this.examMathCorrect = this.examMathWrong = '';
        this.modalErrorMsg = '';
        this.showExamModal = true;
    }
    closeExamModal() { this.showExamModal = false; }

    handleExamTitle(e) { this.examTitle = e.target.value; }
    handleExamDate(e)  { this.examDate = e.target.value; }
    handleExamTotalQ(e) { this.examTotalQuestions = e.target.value; }
    handleExamTotalC(e) { this.examTotalCorrect = e.target.value; }
    handleExamTotalW(e) { this.examTotalWrong = e.target.value; }
    handleExamMathC(e)  { this.examMathCorrect = e.target.value; }
    handleExamMathW(e)  { this.examMathWrong = e.target.value; }

    async handleExamSubmit(event) {
        event.preventDefault();
        const tQ = parseInt(this.examTotalQuestions, 10);
        const tC = parseInt(this.examTotalCorrect, 10);
        const tW = parseInt(this.examTotalWrong, 10);
        const mC = parseInt(this.examMathCorrect, 10);
        const mW = parseInt(this.examMathWrong, 10);
        if (!this.examTitle || !this.examDate || isNaN(tQ) || isNaN(tC) || isNaN(tW) || isNaN(mC) || isNaN(mW)) {
            this.modalErrorMsg = 'Lütfen tüm alanları doldurun.';
            return;
        }
        if (tC + tW > tQ) { this.modalErrorMsg = 'Toplam D+Y, toplam soru sayısını aşamaz.'; return; }
        if (mC + mW > tQ) { this.modalErrorMsg = 'Matematik D+Y, toplam soru sayısını aşamaz.'; return; }
        if (mC > tC)      { this.modalErrorMsg = 'Matematik doğrusu, toplam doğruyu aşamaz.'; return; }
        this.isLoading = true;
        this.modalErrorMsg = '';
        try {
            await submitPracticeExam({
                sessionToken: localStorage.getItem('sessionToken'),
                title: this.examTitle, examDate: this.examDate,
                totalQuestions: tQ, totalCorrect: tC, totalWrong: tW,
                mathCorrect: mC, mathWrong: mW
            });
            this.showExamModal = false;
            await this.loadDashboardData();
        } catch (error) {
            this.modalErrorMsg = error.body ? error.body.message : 'Sınav kaydedilirken hata oluştu.';
        } finally {
            this.isLoading = false;
        }
    }

    handleCurPwd(e) { this.currentPassword = e.target.value; this.pwdErrorMsg = ''; }
    handleNewPwd(e) { this.newPassword = e.target.value;     this.pwdErrorMsg = ''; }
    handleConfPwd(e){ this.confirmPassword = e.target.value; this.pwdErrorMsg = ''; }

    async handlePasswordSubmit(event) {
        event.preventDefault();
        if (!this.currentPassword || !this.newPassword || !this.confirmPassword) { this.pwdErrorMsg = 'Lütfen tüm alanları doldurun.'; return; }
        if (this.newPassword !== this.confirmPassword)  { this.pwdErrorMsg = 'Yeni şifreler eşleşmiyor.'; return; }
        if (this.newPassword.length < 6)               { this.pwdErrorMsg = 'En az 6 karakter olmalıdır.'; return; }
        this.isLoading = true;
        this.pwdErrorMsg = this.pwdSuccessMsg = '';
        try {
            await changePassword({ sessionToken: localStorage.getItem('sessionToken'), role: 'student', currentPassword: this.currentPassword, newPassword: this.newPassword });
            this.pwdSuccessMsg = 'Şifreniz başarıyla güncellendi!';
            this.currentPassword = this.newPassword = this.confirmPassword = '';
        } catch (error) {
            this.pwdErrorMsg = error.body ? error.body.message : 'Şifre değiştirilirken hata oluştu.';
        } finally {
            this.isLoading = false;
        }
    }

    handleLogout() { this.dispatchEvent(new CustomEvent('logout')); }
    stopPropagation(event) { event.stopPropagation(); }
}
