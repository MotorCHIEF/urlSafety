import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Createuser } from './components/createuser/createuser';
import { SubmitURL } from './components/submit-url/submit-url';
import { Reports } from './components/reports/reports';
import { Report} from './components/report/report';
import { ReportInfo } from './components/report-info/report-info';
import { Admin } from './components/admin/admin';
import { TestWebService } from './components/test-web-service/test-web-service';
import { ForgotPassword } from './components/forgot-password/forgot-password';
import { ResetPassword } from './components/reset-password/reset-password';

/**
 * Routing for application
 * Navigation links to key aspects of application - Submit/View Reports, Login, CRUD operations
 */
export const routes: Routes = [
    {
        path: '',
        component: Login
    },

    {
        path: 'createUser',
        component: Createuser
    },

    {
        path: 'submitURL',
        component: SubmitURL
    },

    {
        path: 'reports',
        component: Reports
    },

    {
        path: 'reports/:id',
        component: Report
    },

    {
        path: 'info',
        component: ReportInfo
    },

    {
        path: 'admin',
        component: Admin
    },

    {
        path: 'forgotPassword',
        component: ForgotPassword
    },

    {
        path: 'resetpassword/:token',
        component: ResetPassword
    },

    {
        path: 'test',
        component: TestWebService
    }
];
