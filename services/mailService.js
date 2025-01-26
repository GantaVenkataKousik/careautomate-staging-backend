import nodemailer from 'nodemailer';
import Mailgen from 'mailgen';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    auth: {
        user: process.env.EMAIL_USER, // Your SMTP login
        pass: process.env.SMTP_PASSWORD, // Your SMTP password
    },
});

const mailGenerator = new Mailgen({
    theme: 'default',
    product: {
        name: 'Your Company',
        link: 'https://yourcompany.com/',
    },
});

export const sendVerificationEmail = async (email, verificationCode) => {
    const emailBody = {
        body: {
            name: email,
            intro: 'Welcome to Your Company! We\'re very excited to have you on board.',
            table: {
                data: [
                    {
                        item: 'Verification Code',
                        description: `<strong style="font-size: 24px;">${verificationCode}</strong>`,
                    }
                ],
                columns: {
                    // Optionally, you can customize the column widths
                    customWidth: {
                        item: '20%',
                        description: '80%',
                    },
                    // Optionally, you can customize the column alignment
                    customAlignment: {
                        item: 'left',
                        description: 'right',
                    }
                }
            },
            outro: 'This code will only be valid for 10 minutes. Need help, or have questions? Just reply to this email, we\'d love to help.',
        },
    };

    const emailContent = mailGenerator.generate(emailBody);

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Email Verification',
        html: emailContent,
    };

    try {
        console.log(mailOptions);
        const info = await transporter.sendMail(mailOptions);
        console.log('Verification email sent successfully:', info);
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    } catch (error) {
        console.error('Error sending verification email:', error);
    }
};