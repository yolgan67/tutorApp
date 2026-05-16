import { LightningElement, track } from 'lwc';
import getStudentProfile from '@salesforce/apex/PortalDataService.getStudentProfile';
import getLessons from '@salesforce/apex/PortalDataService.getLessons';
import getHomeworks from '@salesforce/apex/PortalDataService.getHomeworks';

export default class PortalDashboard extends LightningElement {
    @track isLoading = true;
    @track studentName = '';
    @track balance = '0.00';
    
    @track nextLessonDate = 'Yok';
    @track nextLessonBranch = '';
    
    @track pendingHomeworkCount = 0;
    
    @track lessons = [];
    @track hasLessons = false;

    async connectedCallback() {
        await this.loadDashboardData();
    }

    async loadDashboardData() {
        this.isLoading = true;
        const token = localStorage.getItem('sessionToken');
        
        try {
            // Fetch Profile
            const profile = await getStudentProfile({ sessionToken: token });
            this.studentName = profile.First_Name__c;
            this.balance = profile.Balance__c ? profile.Balance__c.toFixed(2) : '0.00';

            // Fetch Lessons
            const allLessons = await getLessons({ sessionToken: token });
            const upcomingLessons = allLessons.filter(l => l.Status__c === 'Scheduled');
            
            if (upcomingLessons.length > 0) {
                // Sort by nearest date (ascending)
                upcomingLessons.sort((a, b) => new Date(a.Date_Time__c) - new Date(b.Date_Time__c));
                
                const nextLesson = upcomingLessons[0];
                const dt = new Date(nextLesson.Date_Time__c);
                this.nextLessonDate = dt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute:'2-digit' });
                this.nextLessonBranch = nextLesson.Branch__c || 'Ders';

                // Format lessons for UI
                this.lessons = upcomingLessons.slice(0, 3).map(l => {
                    const lDate = new Date(l.Date_Time__c);
                    return {
                        ...l,
                        dayStr: lDate.toLocaleDateString('tr-TR', { day: '2-digit' }),
                        monthStr: lDate.toLocaleDateString('tr-TR', { month: 'short' })
                    };
                });
                this.hasLessons = this.lessons.length > 0;
            }

            // Fetch Homeworks
            const homeworks = await getHomeworks({ sessionToken: token });
            const pending = homeworks.filter(hw => hw.Status__c === 'Assigned' || hw.Status__c === 'In Progress');
            this.pendingHomeworkCount = pending.length;

        } catch (error) {
            console.error('Error loading dashboard', error);
            if (error.body && error.body.message && error.body.message.includes('Unauthorized')) {
                this.handleLogout(); // Force logout if token is invalid
            }
        } finally {
            this.isLoading = false;
        }
    }

    handleLogout() {
        const logoutEvent = new CustomEvent('logout');
        this.dispatchEvent(logoutEvent);
    }
}
