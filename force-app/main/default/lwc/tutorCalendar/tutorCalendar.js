import { LightningElement, track, wire } from 'lwc';
import getLessons from '@salesforce/apex/tutorCalendarController.getLessons';

export default class TutorCalendar extends LightningElement {
    @track isLoading = true;
    @track groupedEvents = [];
    @track hasEvents = false;

    connectedCallback() {
        this.fetchEvents();
    }

    async fetchEvents() {
        this.isLoading = true;
        try {
            const result = await getLessons();
            this.processEvents(result);
        } catch (error) {
            console.error('Error fetching lessons', error);
        } finally {
            this.isLoading = false;
        }
    }

    processEvents(events) {
        if (!events || events.length === 0) {
            this.hasEvents = false;
            return;
        }
        
        this.hasEvents = true;
        let groups = {};

        events.forEach(ev => {
            const dt = new Date(ev.startDateTime);
            const dateKey = dt.toISOString().split('T')[0]; // YYYY-MM-DD
            
            if (!groups[dateKey]) {
                groups[dateKey] = {
                    date: dateKey,
                    dayNum: dt.toLocaleDateString('tr-TR', { day: '2-digit' }),
                    monthStr: dt.toLocaleDateString('tr-TR', { month: 'short' }),
                    weekdayStr: dt.toLocaleDateString('tr-TR', { weekday: 'long' }),
                    events: []
                };
            }

            // Determine status from color
            let status = 'Planlandı';
            if (ev.color === '#28a745') status = 'Tamamlandı';
            if (ev.color === '#dc3545') status = 'İptal';

            const endTime = new Date(ev.endDateTime);
            const diffMins = Math.round((endTime - dt) / 60000);

            groups[dateKey].events.push({
                ...ev,
                timeStr: dt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                durationStr: `${diffMins} dk`,
                status: status,
                styleString: `border-left-color: ${ev.color};`
            });
        });

        // Convert object to sorted array
        this.groupedEvents = Object.values(groups).sort((a, b) => new Date(a.date) - new Date(b.date));
    }
}
