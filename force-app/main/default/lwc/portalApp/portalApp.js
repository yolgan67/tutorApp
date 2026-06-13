import { LightningElement, track } from "lwc";
import JOYFUL_TUTOR_IMAGE from "@salesforce/resourceUrl/joyful_math_tutor";

export default class PortalApp extends LightningElement {
  joyfulTutorUrl = JOYFUL_TUTOR_IMAGE;
  @track isAuthenticated = false;
  @track role = "";
  @track showLoginModal = false;

  get isStudent() {
    return this.role === "student";
  }

  get isTeacher() {
    return this.role === "teacher";
  }

  get isParent() {
    return this.role === "parent";
  }

  connectedCallback() {
    this.checkAuthStatus();
  }

  checkAuthStatus() {
    const token = localStorage.getItem("sessionToken");
    const role = localStorage.getItem("sessionRole");
    if (token) {
      this.isAuthenticated = true;
      this.role = role || "student";
    } else {
      this.isAuthenticated = false;
      this.role = "";
    }
  }

  openLogin() {
    this.showLoginModal = true;
  }

  closeLogin() {
    this.showLoginModal = false;
  }

  handleLogin(event) {
    if (event.detail && event.detail.token) {
      localStorage.setItem("sessionToken", event.detail.token);
      const userRole = event.detail.role || "student";
      localStorage.setItem("sessionRole", userRole);
      this.role = userRole;
      this.isAuthenticated = true;
      this.showLoginModal = false;
    }
  }

  handleLogout() {
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("sessionRole");
    this.isAuthenticated = false;
    this.role = "";
    this.showLoginModal = false;
  }

  stopPropagation(event) {
    event.stopPropagation();
  }
}
