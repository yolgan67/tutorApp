import { LightningElement, track } from 'lwc';
import loginApex from '@salesforce/apex/CustomAuthService.login';

export default class PortalLogin extends LightningElement {
    @track username = '';
    @track password = '';
    @track errorMsg = '';
    @track isLoading = false;

    handleUsernameChange(event) {
        this.username = event.target.value;
    }

    handlePasswordChange(event) {
        this.password = event.target.value;
    }

    async doLogin(event) {
        event.preventDefault();
        
        if (!this.username || !this.password) {
            this.errorMsg = 'Lütfen e-posta ve şifrenizi girin.';
            return;
        }

        this.isLoading = true;
        this.errorMsg = '';

        try {
            const token = await loginApex({ username: this.username, clearTextPassword: this.password });
            if (token) {
                // Dispatch event to parent to handle login success
                const loginEvent = new CustomEvent('login', {
                    detail: { token: token }
                });
                this.dispatchEvent(loginEvent);
            }
        } catch (error) {
            this.errorMsg = error.body ? error.body.message : 'Giriş yapılırken bir hata oluştu. Bilgilerinizi kontrol edin.';
        } finally {
            this.isLoading = false;
        }
    }
}
