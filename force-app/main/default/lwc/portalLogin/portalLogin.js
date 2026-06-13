import { LightningElement, track } from 'lwc';
import checkEmailRole from '@salesforce/apex/CustomAuthService.checkEmailRole';
import loginApex from '@salesforce/apex/CustomAuthService.login';

export default class PortalLogin extends LightningElement {
    @track username = '';
    @track password = '';
    @track errorMsg = '';
    @track isLoading = false;
    @track isStepTwo = false;
    @track detectedRole = '';
    @track detectedName = '';

    get roleLabel() {
        if (this.detectedRole === 'student') return 'Öğrenci';
        if (this.detectedRole === 'parent') return 'Veli';
        if (this.detectedRole === 'teacher') return 'Öğretmen';
        return '';
    }

    get roleBadgeClass() {
        return `role-badge ${this.detectedRole}`;
    }

    handleUsernameChange(event) {
        this.username = event.target.value;
        this.errorMsg = '';
    }

    handlePasswordChange(event) {
        this.password = event.target.value;
        this.errorMsg = '';
    }

    // Step 1: Check Email and Detect Role
    async handleNextStep(event) {
        if (event) event.preventDefault();
        
        if (!this.username) {
            this.errorMsg = 'Lütfen geçerli bir e-posta adresi girin.';
            return;
        }

        this.isLoading = true;
        this.errorMsg = '';

        try {
            const response = await checkEmailRole({ email: this.username });
            if (response && response.role !== 'none') {
                this.detectedRole = response.role;
                this.detectedName = response.name;
                this.isStepTwo = true;
            } else {
                this.errorMsg = 'Bu e-posta adresi sistemde kayıtlı görünmüyor. Lütfen kontrol edin.';
            }
        } catch (error) {
            this.errorMsg = error.body ? error.body.message : 'Sistem bağlantı hatası oluştu.';
        } finally {
            this.isLoading = false;
        }
    }

    // Step 2: Go back to Step 1
    handlePrevStep() {
        this.isStepTwo = false;
        this.password = '';
        this.errorMsg = '';
    }

    // Step 2: Submit password and login
    async doLogin(event) {
        if (event) event.preventDefault();
        
        if (!this.password) {
            this.errorMsg = 'Lütfen şifrenizi girin.';
            return;
        }

        this.isLoading = true;
        this.errorMsg = '';

        try {
            const response = await loginApex({ username: this.username, clearTextPassword: this.password });
            if (response && response.token) {
                // Dispatch login event to portalApp
                const loginEvent = new CustomEvent('login', {
                    detail: { token: response.token, role: response.role }
                });
                this.dispatchEvent(loginEvent);
            }
        } catch (error) {
            this.errorMsg = error.body ? error.body.message : 'Hatalı şifre girdiniz. Tekrar deneyin.';
        } finally {
            this.isLoading = false;
        }
    }
}