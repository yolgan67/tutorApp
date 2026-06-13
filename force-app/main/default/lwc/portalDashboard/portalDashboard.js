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
    @track activeTab = 'summary'; // 'summary', 'lessons', 'homeworks', 'exams', 'password'
    
    // Profile metrics (Financials strictly removed)
    @track studentName = '';
    @track studentGrade = '';
    @track studentSchool = '';
    @track studentRegDate = '';
    
    @track nextLessonDate = 'Yok';
    @track nextLessonBranch = '';
    @track pendingHomeworkCount = 0;
    
    @track lessons = [];
    @track allLessons = [];
    @track hasLessons = false;
    @track homeworks = [];
    @track exams = [];

    // Modals & Forms State
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

    // Active Navigation Tab State Getters
    get isSummaryActive() { return this.activeTab === 'summary'; }
    get isLessonsActive() { return this.activeTab === 'lessons'; }
    get isHomeworksActive() { return this.activeTab === 'homeworks'; }
    get isExamsActive() { return this.activeTab === 'exams'; }
    get isPasswordActive() { return this.activeTab === 'password'; }

    get sidebarSummaryClass() { return this.activeTab === 'summary' ? 'active' : ''; }
    get sidebarLessonsClass() { return this.activeTab === 'lessons' ? 'active' : ''; }
    get sidebarHomeworksClass() { return this.activeTab === 'homeworks' ? 'active' : ''; }
    get sidebarExamsClass() { return this.activeTab === 'exams' ? 'active' : ''; }
    get sidebarPasswordClass() { return this.activeTab === 'password' ? 'active' : ''; }

    async connectedCallback() {
        // Default today's date for exams
        this.examDate = new Date().toISOString().split('T')[0];
        await this.loadDashboardData();
    }

    async loadDashboardData() {
        this.isLoading = true;
        const token = localStorage.getItem('sessionToken');
        
        try {
            // 1. Fetch Profile
            const profile = await getStudentProfile({ sessionToken: token });
            this.studentName = profile.Name;
            this.studentGrade = profile.Grade__c || 'Belirtilmemiş';
            this.studentSchool = profile.School__c || 'Belirtilmemiş';
            
            if (profile.Registration_Date__c) {
                const regDateObj = new Date(profile.Registration_Date__c);
                this.studentRegDate = regDateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
            } else {
                this.studentRegDate = 'Belirtilmemiş';
            }

            // 2. Fetch Lessons
            this.allLessons = await getLessons({ sessionToken: token });
            const upcomingLessons = this.allLessons.filter(l => l.Status__c === 'Scheduled');
            
            if (upcomingLessons.length > 0) {
                // Sort by nearest date (ascending)
                const sortedUpcoming = [...upcomingLessons].sort((a, b) => new Date(a.Date_Time__c) - new Date(b.Date_Time__c));
                const nextLesson = sortedUpcoming[0];
                const dt = new Date(nextLesson.Date_Time__c);
                this.nextLessonDate = dt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute:'2-digit' });
                this.nextLessonBranch = nextLesson.Branch__c || 'Ders';

                // Format up to 5 upcoming lessons for UI
                this.lessons = sortedUpcoming.slice(0, 5).map(l => {
                    const lDate = new Date(l.Date_Time__c);
                    return {
                        ...l,
                        dateStr: lDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
                        timeStr: lDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                        dayStr: lDate.toLocaleDateString('tr-TR', { day: '2-digit' }),
                        monthStr: lDate.toLocaleDateString('tr-TR', { month: 'short' })
                    };
                });
                this.hasLessons = this.lessons.length > 0;
            } else {
                this.nextLessonDate = 'Yok';
                this.nextLessonBranch = '';
                this.lessons = [];
                this.hasLessons = false;
            }

            // 3. Fetch Homeworks
            this.homeworks = await getHomeworks({ sessionToken: token });
            const pending = this.homeworks.filter(hw => hw.Status__c === 'Assigned' || hw.Status__c === 'In Progress');
            this.pendingHomeworkCount = pending.length;
            
            // Format homework dates
            this.homeworks = this.homeworks.map(hw => {
                const dueDateObj = new Date(hw.Due_Date__c);
                const isOverdue = dueDateObj < new Date() && (hw.Status__c === 'Assigned' || hw.Status__c === 'In Progress');
                return {
                    ...hw,
                    dueDateStr: dueDateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
                    isPending: hw.Status__c === 'Assigned' || hw.Status__c === 'In Progress',
                    isSubmitted: hw.Status__c === 'Submitted',
                    isGraded: hw.Status__c === 'Completed' || hw.Status__c === 'Incomplete',
                    isOverdue: isOverdue,
                    badgeClass: hw.Status__c === 'Submitted' ? 'badge-submitted' : 
                                hw.Status__c === 'Completed' ? 'badge-completed' : 
                                hw.Status__c === 'Incomplete' ? 'badge-incomplete' : 'badge-assigned',
                    statusText: hw.Status__c === 'Submitted' ? 'Teslim Edildi' : 
                                hw.Status__c === 'Completed' ? 'Tamamlandı' : 
                                hw.Status__c === 'Incomplete' ? 'Eksik Yapıldı' : 'Ödev Verildi'
                };
            });

            // 4. Fetch Exams
            const rawExams = await getExams({ sessionToken: token });
            this.exams = rawExams.map(ex => {
                const examDateObj = new Date(ex.Date__c);
                return {
                    ...ex,
                    examDateStr: examDateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
                    totalNetFormatted: ex.Total_Net__c != null ? ex.Total_Net__c.toFixed(2) : '0.00',
                    mathNetFormatted: ex.Math_Net__c != null ? ex.Math_Net__c.toFixed(2) : '0.00'
                };
            });

        } catch (error) {
            console.error('Error loading dashboard', error);
            if (error.body && error.body.message && error.body.message.includes('Unauthorized')) {
                this.handleLogout();
            }
        } finally {
            this.isLoading = false;
        }
    }

    // Tab Navigation Handlers
    handleTabClick(event) {
        event.preventDefault();
        const tab = event.currentTarget.dataset.tab;
        this.activeTab = tab;
        this.pwdErrorMsg = '';
        this.pwdSuccessMsg = '';
        this.modalErrorMsg = '';
    }

    // Homework Submit Flow
    openSubmitHomework(event) {
        const homeworkId = event.target.dataset.id;
        this.activeHomework = this.homeworks.find(hw => hw.Id === homeworkId);
        this.hwCompletedQuestions = '';
        this.hwCorrects = '';
        this.hwWrongs = '';
        this.hwComment = '';
        this.modalErrorMsg = '';
        this.showHomeworkModal = true;
    }

    closeHomeworkModal() {
        this.showHomeworkModal = false;
        this.activeHomework = null;
    }

    handleHwCompletedChange(event) { this.hwCompletedQuestions = event.target.value; }
    handleHwCorrectsChange(event) { this.hwCorrects = event.target.value; }
    handleHwWrongsChange(event) { this.hwWrongs = event.target.value; }
    handleHwCommentChange(event) { this.hwComment = event.target.value; }

    async handleHomeworkSubmit(event) {
        event.preventDefault();
        const token = localStorage.getItem('sessionToken');
        
        // Validation
        const completedVal = parseInt(this.hwCompletedQuestions, 10);
        const correctVal = parseInt(this.hwCorrects, 10);
        const wrongVal = parseInt(this.hwWrongs, 10);

        if (isNaN(completedVal) || isNaN(correctVal) || isNaN(wrongVal)) {
            this.modalErrorMsg = 'Lütfen tüm soru sayısı alanlarını doldurun.';
            return;
        }
        if (correctVal + wrongVal > completedVal) {
            this.modalErrorMsg = 'Doğru ve yanlış soru sayısı toplamı, çözülen soru sayısından fazla olamaz.';
            return;
        }

        this.isLoading = true;
        this.modalErrorMsg = '';

        try {
            await submitHomework({
                sessionToken: token,
                homeworkId: this.activeHomework.Id,
                completedQuestions: completedVal,
                corrects: correctVal,
                wrongs: wrongVal,
                comment: this.hwComment
            });
            this.showHomeworkModal = false;
            await this.loadDashboardData();
        } catch (error) {
            this.modalErrorMsg = error.body ? error.body.message : 'Ödev gönderilirken bir hata oluştu.';
        } finally {
            this.isLoading = false;
        }
    }

    // Practice Exam Log Flow
    openAddExam() {
        this.examTitle = '';
        this.examDate = new Date().toISOString().split('T')[0];
        this.examTotalQuestions = '';
        this.examTotalCorrect = '';
        this.examTotalWrong = '';
        this.examMathCorrect = '';
        this.examMathWrong = '';
        this.modalErrorMsg = '';
        this.showExamModal = true;
    }

    closeExamModal() {
        this.showExamModal = false;
    }

    handleExamTitle(event) { this.examTitle = event.target.value; }
    handleExamDate(event) { this.examDate = event.target.value; }
    handleExamTotalQ(event) { this.examTotalQuestions = event.target.value; }
    handleExamTotalC(event) { this.examTotalCorrect = event.target.value; }
    handleExamTotalW(event) { this.examTotalWrong = event.target.value; }
    handleExamMathC(event) { this.examMathCorrect = event.target.value; }
    handleExamMathW(event) { this.examMathWrong = event.target.value; }

    async handleExamSubmit(event) {
        event.preventDefault();
        const token = localStorage.getItem('sessionToken');
        
        // Validations
        const tQ = parseInt(this.examTotalQuestions, 10);
        const tC = parseInt(this.examTotalCorrect, 10);
        const tW = parseInt(this.examTotalWrong, 10);
        const mC = parseInt(this.examMathCorrect, 10);
        const mW = parseInt(this.examMathWrong, 10);

        if (!this.examTitle || !this.examDate || isNaN(tQ) || isNaN(tC) || isNaN(tW) || isNaN(mC) || isNaN(mW)) {
            this.modalErrorMsg = 'Lütfen tüm alanları doldurun.';
            return;
        }
        if (tC + tW > tQ) {
            this.modalErrorMsg = 'Toplam doğru ve yanlış soru sayısı, toplam soru sayısını aşamaz.';
            return;
        }
        if (mC + mW > tQ) {
            this.modalErrorMsg = 'Matematik doğru ve yanlış soru sayısı, toplam soru sayısını aşamaz.';
            return;
        }
        if (mC > tC) {
            this.modalErrorMsg = 'Matematik doğru sayısı, toplam doğru sayısından fazla olamaz.';
            return;
        }

        this.isLoading = true;
        this.modalErrorMsg = '';

        try {
            await submitPracticeExam({
                sessionToken: token,
                title: this.examTitle,
                examDate: this.examDate,
                totalQuestions: tQ,
                totalCorrect: tC,
                totalWrong: tW,
                mathCorrect: mC,
                mathWrong: mW
            });
            this.showExamModal = false;
            await this.loadDashboardData();
        } catch (error) {
            this.modalErrorMsg = error.body ? error.body.message : 'Sınav kaydedilirken bir hata oluştu.';
        } finally {
            this.isLoading = false;
        }
    }

    // Change Password Flow
    handleCurPwd(event) { this.currentPassword = event.target.value; this.pwdErrorMsg = ''; }
    handleNewPwd(event) { this.newPassword = event.target.value; this.pwdErrorMsg = ''; }
    handleConfPwd(event) { this.confirmPassword = event.target.value; this.pwdErrorMsg = ''; }

    async handlePasswordSubmit(event) {
        event.preventDefault();
        const token = localStorage.getItem('sessionToken');

        if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
            this.pwdErrorMsg = 'Lütfen tüm şifre alanlarını doldurun.';
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
                role: 'student',
                currentPassword: this.currentPassword,
                newPassword: this.newPassword
            });
            this.pwdSuccessMsg = 'Şifreniz başarıyla güncellendi!';
            this.currentPassword = '';
            this.newPassword = '';
            this.confirmPassword = '';
        } catch (error) {
            this.pwdErrorMsg = error.body ? error.body.message : 'Şifre değiştirilirken bir hata oluştu.';
        } finally {
            this.isLoading = false;
        }
    }

    handleLogout() {
        const logoutEvent = new CustomEvent('logout');
        this.dispatchEvent(logoutEvent);
    }

    stopPropagation(event) {
        event.stopPropagation();
    }
}