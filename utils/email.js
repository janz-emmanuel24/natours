const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');
// whenever we are to send an email we shall call this class ie new Email(user, url).sendWelcome();
// we shall keep adding new emails for different scenarios like above
module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `Jans Abbas <${process.env.EMAIL_FROM}>`;
    }

    newTransport() {
        //for production we shall use a real one and for dev we shall use mail trap
        if (process.env.NODE_ENV === 'production') {
            // SENDGRID
            return nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD
                }
            })
        }
        return nodemailer.createTransport({
            host: `${process.env.EMAIL_HOST}`,
            port: process.env.EMAIL_PORT,
            auth: {
                user: `${process.env.EMAIL_USERNAME}`,
                pass: `${process.env.EMAIL_PASSWORD}`
            }
        });
    }

    async send(template, subject) {
        // send the actual email
        // 1) Render the HTML for the email based on the pub template
        const html = pug.renderFile(
            `${__dirname}/../views/email/${template}.pug`, {
                firstName: this.firstName,
                url: this.url,
                subject
            }
        );

        // 2) Define the email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            // including a text version for our email. This is important  for spam folders and email delivery rates
            text: htmlToText.fromString(html)
        };

        // 3) Create the transport and send mail
        await this.newTransport().sendMail(mailOptions);
    }

    async sendWelcome() {
        await this.send('welcome', 'welcome to the natours family!');
    }

    async sendPasswordReset() {
        await this.send('passwordReset', 'Your password reset token (Valid for only 10 minutes)');
    }
};