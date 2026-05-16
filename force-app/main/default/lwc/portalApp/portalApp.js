import { LightningElement, track } from 'lwc';

export default class PortalApp extends LightningElement {
    @track isAuthenticated = false;

    connectedCallback() {
        this.checkAuthStatus();
    }

    checkAuthStatus() {
        const token = localStorage.getItem('sessionToken');
        if (token) {
            this.isAuthenticated = true;
        } else {
            this.isAuthenticated = false;
        }
    }

    handleLogin(event) {
        // Expected event.detail.token
        if (event.detail && event.detail.token) {
            localStorage.setItem('sessionToken', event.detail.token);
            this.isAuthenticated = true;
        }
    }

    handleLogout() {
        localStorage.removeItem('sessionToken');
        this.isAuthenticated = false;
    }
}
