import { LightningElement, track } from 'lwc';
import getWeeklyLessons from '@salesforce/apex/TutorPortalDataService.getWeeklyLessons';
import getStudentDropdownOptions from '@salesforce/apex/TutorPortalDataService.getStudentDropdownOptions';
import upsertLesson from '@salesforce/apex/TutorPortalDataService.upsertLesson';
import generateWeeklyLessonsFromSchedule from '@salesforce/apex/TutorPortalDataService.generateWeeklyLessonsFromSchedule';

export default class TutorScheduleCalendar extends LightningElement {
    @track isLoading = false;
    @track currentDate = new Date(); // Represents a day in the current week
    @track weekDays = [];
    @track studentOptions = [];
    
    @track isModalOpen = false;
    @track isMonthModalOpen = false;
    @track isEditMode = false;
    @track currentLesson = {};
    @track viewDate = new Date(); // Date used for month view browsing
    
    // Month View Lessons for daily status dots
    @track monthLessons = [];
    @track genStatusMessage = '';
    @track genStatusType = '';

    get weekDateRangeStr() {
        if (this.weekDays.length === 0) return '';
        const first = this.weekDays[0].formattedDate;
        const last = this.weekDays[6].formattedDate;
        return `${first} - ${last}`;
    }

    get modalTitle() {
        return this.isEditMode ? 'Dersi Düzenle' : 'Yeni Ders Ekle';
    }

    // Status helpers for edit mode
    get isScheduled() { return this.currentLesson.Status__c === 'Scheduled'; }
    get isCompleted() { return this.currentLesson.Status__c === 'Completed'; }
    get isCanceledByStudent() { return this.currentLesson.Status__c === 'Canceled by Student'; }
    get isCanceledByTeacher() { return this.currentLesson.Status__c === 'Canceled by Teacher'; }

    get monthLabel() {
        return this.viewDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    }

    get monthDays() {
        const year = this.viewDate.getFullYear();
        const month = this.viewDate.getMonth();
        
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        
        const days = [];
        
        // Offset for the first day (get previous month's tail)
        let firstDayIdx = firstDayOfMonth.getDay(); 
        if (firstDayIdx === 0) firstDayIdx = 7; // Sunday adjust
        firstDayIdx--; // Monday start

        for (let i = 0; i < firstDayIdx; i++) {
            days.push({ id: `blank-${i}`, dayNumber: '', className: 'month-day empty', hasDots: false, dots: [] });
        }

        const todayStr = new Date().toISOString().split('T')[0];

        for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
            const date = new Date(year, month, i);
            const dateStr = date.toISOString().split('T')[0];
            let className = 'month-day';
            if (dateStr === todayStr) className += ' today';
            
            // Filter monthLessons for this specific date
            const dayLessons = this.monthLessons.filter(l => l.Date_Time__c.startsWith(dateStr));
            
            // Determine status dots
            const dots = [];
            let hasScheduled = false;
            let hasCompleted = false;
            let hasCanceled = false;
            
            dayLessons.forEach(l => {
                if (l.Status__c === 'Scheduled') hasScheduled = true;
                else if (l.Status__c === 'Completed') hasCompleted = true;
                else if (l.Status__c && l.Status__c.includes('Cancel')) hasCanceled = true;
            });
            
            if (hasScheduled) dots.push({ key: 'sched', dotClass: 'dot dot-scheduled' });
            if (hasCompleted) dots.push({ key: 'compl', dotClass: 'dot dot-completed' });
            if (hasCanceled) dots.push({ key: 'canc', dotClass: 'dot dot-canceled' });

            days.push({
                id: `day-${i}`,
                dayNumber: i,
                date: dateStr,
                className: className,
                hasDots: dots.length > 0,
                dots: dots
            });
        }
        return days;
    }

    connectedCallback() {
        // Adjust current date to the start of the week (Monday)
        this.currentDate = this.getMonday(new Date());
        this.loadDropdownOptions();
        this.refreshCalendar();
    }

    getMonday(d) {
        d = new Date(d);
        var day = d.getDay(),
            diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        return new Date(d.setDate(diff));
    }

    async loadDropdownOptions() {
        const token = localStorage.getItem('sessionToken');
        try {
            this.studentOptions = await getStudentDropdownOptions({ token: token });
        } catch (e) {
            this.handleError(e, 'Öğrenci listesi alınamadı');
        }
    }

    handleError(error, customMsg) {
        console.error(customMsg, error);
        const msg = error.body ? error.body.message : error.message;
        if (msg && msg.includes('Unauthorized')) {
            localStorage.removeItem('sessionToken');
            window.location.reload(); // Redirect to login
        }
    }

    async refreshCalendar() {
        this.isLoading = true;
        const token = localStorage.getItem('sessionToken');
        
        const startDate = new Date(this.currentDate);
        startDate.setHours(0,0,0,0);
        
        const endDate = new Date(this.currentDate);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23,59,59,999);

        try {
            const lessons = await getWeeklyLessons({ 
                token: token, 
                startDate: startDate.toISOString(), 
                endDate: endDate.toISOString() 
            });
            this.buildWeekDays(lessons);
        } catch (e) {
            this.handleError(e, 'Dersler alınamadı');
        } finally {
            this.isLoading = false;
        }
    }

    buildWeekDays(lessons) {
        let days = [];
        let tempDate = new Date(this.currentDate);
        
        const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

        for (let i = 0; i < 7; i++) {
            const dateStr = tempDate.toISOString().split('T')[0];
            
            // Filter lessons for this day
            let dayLessons = lessons.filter(l => l.Date_Time__c.startsWith(dateStr)).map(l => {
                const lDate = new Date(l.Date_Time__c);
                const endDate = new Date(lDate.getTime() + (l.Duration_Minutes__c || 60) * 60000);
                
                let cardClass = 'lesson-card status-Scheduled';
                if (l.Status__c === 'Completed') cardClass = 'lesson-card status-Completed';
                else if (l.Status__c && l.Status__c.includes('Cancel')) cardClass = 'lesson-card status-Canceled';
                
                return {
                    ...l,
                    timeStr: lDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                    endTimeStr: endDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                    StudentName: l.Student__r ? `${l.Student__r.First_Name__c} ${l.Student__r.Last_Name__c}` : 'Bilinmeyen Öğrenci',
                    cardClass: cardClass
                };
            });

            days.push({
                dateStr: dateStr,
                dayName: dayNames[i],
                formattedDate: tempDate.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }),
                lessons: dayLessons
            });

            tempDate.setDate(tempDate.getDate() + 1);
        }
        this.weekDays = days;
    }

    previousWeek() {
        this.currentDate.setDate(this.currentDate.getDate() - 7);
        this.refreshCalendar();
    }

    nextWeek() {
        this.currentDate.setDate(this.currentDate.getDate() + 7);
        this.refreshCalendar();
    }

    // Modal Operations
    openAddModal() {
        this.isEditMode = false;
        this.currentLesson = {
            sobjectType: 'Lesson__c',
            Student__c: '',
            Branch__c: '',
            Date_Time__c: '',
            dateInput: '',
            Duration_Minutes__c: 60,
            Hourly_Rate__c: 500,
            Status__c: 'Scheduled'
        };
        this.studentOptions = this.studentOptions.map(opt => ({...opt, selected: false}));
        this.isModalOpen = true;
    }

    async openMonthModal() {
        this.viewDate = new Date(this.currentDate);
        this.isMonthModalOpen = true;
        await this.loadMonthLessons();
    }

    closeMonthModal() {
        this.isMonthModalOpen = false;
    }

    async prevMonth() {
        this.viewDate = new Date(this.viewDate.setMonth(this.viewDate.getMonth() - 1));
        await this.loadMonthLessons();
    }

    async nextMonth() {
        this.viewDate = new Date(this.viewDate.setMonth(this.viewDate.getMonth() + 1));
        await this.loadMonthLessons();
    }

    // Fetch monthly records to render daily colored dots
    async loadMonthLessons() {
        const token = localStorage.getItem('sessionToken');
        const year = this.viewDate.getFullYear();
        const month = this.viewDate.getMonth();
        
        const startDate = new Date(year, month, 1, 0, 0, 0, 0);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
        
        try {
            this.monthLessons = await getWeeklyLessons({ 
                token: token, 
                startDate: startDate.toISOString(), 
                endDate: endDate.toISOString() 
            });
        } catch (e) {
            console.error('Error fetching month lessons', e);
        }
    }

    selectMonthDay(event) {
        const selectedDateStr = event.currentTarget.dataset.date;
        if (!selectedDateStr) return;
        
        this.currentDate = this.getMonday(new Date(selectedDateStr));
        this.isMonthModalOpen = false;
        this.refreshCalendar();
    }

    openEditModal(event) {
        const lessonId = event.currentTarget.dataset.id;
        // Find lesson from weekDays
        let targetLesson = null;
        for (let d of this.weekDays) {
            let found = d.lessons.find(l => l.Id === lessonId);
            if (found) { targetLesson = found; break; }
        }

        if (targetLesson) {
            this.isEditMode = true;
            // format datetime-local input YYYY-MM-DDThh:mm
            const dt = new Date(targetLesson.Date_Time__c);
            const offset = dt.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(dt - offset)).toISOString().slice(0,16);

            this.currentLesson = {
                Id: targetLesson.Id,
                sobjectType: 'Lesson__c',
                Student__c: targetLesson.Student__c,
                Branch__c: targetLesson.Branch__c,
                Date_Time__c: targetLesson.Date_Time__c,
                dateInput: localISOTime,
                Duration_Minutes__c: targetLesson.Duration_Minutes__c,
                Hourly_Rate__c: targetLesson.Hourly_Rate__c,
                Status__c: targetLesson.Status__c
            };

            this.studentOptions = this.studentOptions.map(opt => ({
                ...opt, 
                selected: opt.value === targetLesson.Student__c
            }));

            this.isModalOpen = true;
        }
    }

    closeModal() {
        this.isModalOpen = false;
    }

    // On-demand auto generation from Recurring Schedule templates
    async handleGenerateFromSchedule() {
        this.isLoading = true;
        this.genStatusMessage = '';
        const token = localStorage.getItem('sessionToken');
        
        try {
            const count = await generateWeeklyLessonsFromSchedule({ token: token });
            this.genStatusMessage = `Önümüzdeki hafta için şablondan ${count} adet ders programı başarıyla oluşturuldu!`;
            this.genStatusType = 'success';
            
            // Advance to next week's view to see the generated lessons!
            const nextMon = this.getMonday(new Date());
            nextMon.setDate(nextMon.getDate() + 7);
            this.currentDate = nextMon;
            
            await this.refreshCalendar();
        } catch (error) {
            this.genStatusMessage = error.body ? error.body.message : 'Dersler oluşturulurken bir hata oluştu.';
            this.genStatusType = 'error';
        } finally {
            this.isLoading = false;
            // Clear message after 6 seconds
            setTimeout(() => {
                this.genStatusMessage = '';
            }, 6000);
        }
    }

    // Input handlers
    handleStudentChange(e) { 
        const studentId = e.target.value;
        this.currentLesson.Student__c = studentId; 
        
        // Auto-populate default rate for new lessons
        const student = this.studentOptions.find(opt => opt.value === studentId);
        if (student && !this.isEditMode) {
            this.currentLesson.Hourly_Rate__c = student.defaultRate;
        }
    }
    
    handleBranchChange(e) { this.currentLesson.Branch__c = e.target.value; }
    
    handleDateChange(e) { 
        if (!e.target.value) return;
        
        let dateVal = new Date(e.target.value);
        let minutes = dateVal.getMinutes();
        
        // Round to nearest 15 minutes
        minutes = Math.round(minutes / 15) * 15;
        if (minutes === 60) {
            dateVal.setHours(dateVal.getHours() + 1);
            minutes = 0;
        }
        dateVal.setMinutes(minutes);
        
        const offset = dateVal.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(dateVal - offset)).toISOString().slice(0,16);
        
        this.currentLesson.dateInput = localISOTime;
        this.currentLesson.Date_Time__c = dateVal.toISOString();
    }
    
    handleDurationChange(e) { this.currentLesson.Duration_Minutes__c = e.target.value; }
    handleRateChange(e) { this.currentLesson.Hourly_Rate__c = e.target.value; }
    handleStatusChange(e) { this.currentLesson.Status__c = e.target.value; }

    async saveLesson() {
        if (!this.currentLesson.Student__c || !this.currentLesson.Date_Time__c || !this.currentLesson.Branch__c) {
            alert('Lütfen Öğrenci, Branş ve Tarih bilgilerini doldurun.');
            return;
        }

        this.isLoading = true;
        const token = localStorage.getItem('sessionToken');
        
        try {
            let record = {
                sobjectType: 'Lesson__c',
                Student__c: this.currentLesson.Student__c,
                Branch__c: this.currentLesson.Branch__c,
                Date_Time__c: this.currentLesson.Date_Time__c,
                Duration_Minutes__c: parseInt(this.currentLesson.Duration_Minutes__c),
                Hourly_Rate__c: parseFloat(this.currentLesson.Hourly_Rate__c),
                Status__c: this.currentLesson.Status__c
            };
            if (this.isEditMode) {
                record.Id = this.currentLesson.Id;
            }

            await upsertLesson({ token: token, lessonData: record });
            this.closeModal();
            this.refreshCalendar();
        } catch (e) {
            console.error('Error saving lesson', e);
            alert('Kaydedilirken bir hata oluştu.');
        } finally {
            this.isLoading = false;
        }
    }

    stopPropagation(event) {
        event.stopPropagation();
    }
}