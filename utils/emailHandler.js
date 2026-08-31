const nodemailer = require("nodemailer");
const { convert } = require("html-to-text");
const fs = require("fs");
const path = require("path");
const welcomeTemplateHtml = fs.readFileSync(
  path.join(__dirname, "../templates/email/welcome.html"),
  "utf-8",
);
const resetPasswordHtml = fs.readFileSync(
  path.join(__dirname, "../templates/email/passwordReset.html"),
  "utf-8",
);
module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstname = user.name.split(" ")[0];
    this.url = url;
    this.from = `Natours <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      // add sudgrid code
      return nodemailer.createTransport({
        service: "SendGrid",
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),

      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // send() take 2 argumetns 1 - Take Html template , 2 - subject for mail
  async send(template, subject) {
    // 1) Render html base on template

    // 2) Define Email options
    const html = template
      .replace(/{{name}}/g, this.firstname)
      .replace(/{{url}}/g, this.url);

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      text: convert(html),
      html: html,
    };

    // 3) Create transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send(welcomeTemplateHtml, "Welcome to Natours...");
  }

  async resetPassword() {
    await this.send(
      resetPasswordHtml,
      "Your password is reset valid up to 10 min",
    );
  }
};
