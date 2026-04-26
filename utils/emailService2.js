const nodemailer = require("nodemailer");
require("dotenv").config();

// Create transporter
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false,
    },
});

// Verify transporter on startup
transporter.verify((error, success) => {
    if (error) {
        console.error("Email transporter error:", error);
    } else {
        console.log("Email service is ready to send messages");
    }
});

// Generate admin email template
const generateAdminEmailTemplate = (data) => {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Contact Form Submission</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    line-height: 1.6;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    margin: 0;
                    padding: 20px;
                }
                .container {
                    max-width: 700px;
                    margin: 0 auto;
                    background: #ffffff;
                    border-radius: 24px;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                }
                .header {
                    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                    padding: 40px 30px;
                    text-align: center;
                }
                .header h1 {
                    color: white;
                    margin: 0;
                    font-size: 28px;
                    font-weight: 700;
                }
                .header p {
                    color: #94a3b8;
                    margin-top: 10px;
                    font-size: 14px;
                }
                .content {
                    padding: 40px;
                }
                .alert-badge {
                    display: inline-block;
                    background: #ef4444;
                    color: white;
                    padding: 6px 14px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    margin-bottom: 25px;
                }
                .greeting {
                    font-size: 20px;
                    font-weight: 600;
                    color: #1e293b;
                    margin-bottom: 15px;
                }
                .info-section {
                    background: #f8fafc;
                    border-radius: 20px;
                    padding: 25px;
                    margin: 25px 0;
                    border: 1px solid #e2e8f0;
                }
                .info-row {
                    display: flex;
                    padding: 12px 0;
                    border-bottom: 1px solid #e2e8f0;
                }
                .info-row:last-child {
                    border-bottom: none;
                }
                .info-label {
                    font-weight: 700;
                    width: 130px;
                    color: #475569;
                    font-size: 14px;
                }
                .info-value {
                    flex: 1;
                    color: #1e293b;
                    font-size: 14px;
                    word-break: break-word;
                }
                .message-box {
                    background: #fef3c7;
                    border-left: 4px solid #f59e0b;
                    padding: 20px;
                    border-radius: 12px;
                    margin: 20px 0;
                }
                .message-box p {
                    color: #92400e;
                    line-height: 1.7;
                    margin-top: 10px;
                }
                .action-buttons {
                    display: flex;
                    gap: 15px;
                    margin-top: 30px;
                    flex-wrap: wrap;
                }
                .btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 24px;
                    border-radius: 12px;
                    text-decoration: none;
                    font-weight: 600;
                    font-size: 14px;
                    transition: all 0.2s;
                }
                .btn-primary {
                    background: #3b82f6;
                    color: white;
                }
                .btn-primary:hover {
                    background: #2563eb;
                    transform: translateY(-2px);
                }
                .btn-secondary {
                    background: #10b981;
                    color: white;
                }
                .btn-secondary:hover {
                    background: #059669;
                    transform: translateY(-2px);
                }
                .footer {
                    background: #f1f5f9;
                    padding: 30px;
                    text-align: center;
                    border-top: 1px solid #e2e8f0;
                }
                .footer p {
                    color: #64748b;
                    font-size: 13px;
                    margin: 5px 0;
                }
                @media (max-width: 600px) {
                    .content {
                        padding: 25px;
                    }
                    .info-row {
                        flex-direction: column;
                    }
                    .info-label {
                        width: auto;
                        margin-bottom: 5px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📬 New Contact Form Submission</h1>
                    <p>STR Solutions Limited - Client Inquiry</p>
                </div>
                
                <div class="content">
                    <div class="alert-badge">🔔 ACTION REQUIRED</div>
                    
                    <div class="greeting">
                        Hello Team,
                    </div>
                    
                    <p style="color: #475569; margin-bottom: 20px;">
                        A new client has submitted a contact form on your website. Here are the details:
                    </p>
                    
                    <div class="info-section">
                        <div class="info-row">
                            <div class="info-label">👤 Full Name</div>
                            <div class="info-value">${data.name}</div>
                        </div>
                        ${
                            data.companyName
                                ? `
                        <div class="info-row">
                            <div class="info-label">🏢 Company Name</div>
                            <div class="info-value">${data.companyName}</div>
                        </div>
                        `
                                : ""
                        }
                        <div class="info-row">
                            <div class="info-label">📧 Email Address</div>
                            <div class="info-value">
                                <a href="mailto:${data.email}" style="color: #3b82f6;">${data.email}</a>
                            </div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">📞 Phone Number</div>
                            <div class="info-value">
                                <a href="tel:${data.phoneNumber}" style="color: #3b82f6;">${data.phoneNumber}</a>
                            </div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">🕐 Submitted At</div>
                            <div class="info-value">${new Date().toLocaleString("en-US", {
                                timeZone: "Asia/Dhaka",
                                dateStyle: "full",
                                timeStyle: "long",
                            })}</div>
                        </div>
                    </div>
                    
                    <div class="message-box">
                        <strong style="color: #92400e;">💬 Message from client:</strong>
                        <p>${data.details.replace(/\n/g, "<br>")}</p>
                    </div>
                    
                    <div class="action-buttons">
                        <a href="mailto:${data.email}" class="btn btn-primary">
                            ✉️ Reply to Client
                        </a>
                        <a href="tel:${data.phoneNumber}" class="btn btn-secondary">
                            📞 Call Client
                        </a>
                    </div>
                </div>
                
                <div class="footer">
                    <p><strong>STR Solutions Limited</strong></p>
                    <p>970 East Shewrapara, Dhaka 1216, Bangladesh</p>
                    <p>📞 BD: +880 1332-802026 | EU: +39 344 7792783</p>
                    <p>✉️ ${process.env.EMAIL_USER}</p>
                    <p style="margin-top: 15px; font-size: 12px;">
                        This is an automated notification from your website contact form.
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;
};

// Generate customer acknowledgment email template
const generateCustomerEmailTemplate = (data) => {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Thank You for Contacting STR Solutions</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    line-height: 1.6;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    margin: 0;
                    padding: 20px;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: #ffffff;
                    border-radius: 24px;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                }
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 40px 30px;
                    text-align: center;
                }
                .header h1 {
                    color: white;
                    margin: 0;
                    font-size: 28px;
                    font-weight: 700;
                }
                .header p {
                    color: rgba(255,255,255,0.9);
                    margin-top: 10px;
                }
                .content {
                    padding: 40px;
                }
                .greeting {
                    font-size: 22px;
                    font-weight: 600;
                    color: #1e293b;
                    margin-bottom: 20px;
                }
                .message {
                    color: #475569;
                    margin-bottom: 25px;
                    line-height: 1.7;
                }
                .info-box {
                    background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
                    border-radius: 20px;
                    padding: 25px;
                    margin: 25px 0;
                    border-left: 4px solid #667eea;
                }
                .info-title {
                    font-weight: 700;
                    color: #5b21b6;
                    margin-bottom: 15px;
                    font-size: 16px;
                }
                .next-steps {
                    background: #f0fdf4;
                    border-radius: 16px;
                    padding: 20px;
                    margin: 25px 0;
                }
                .step {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 15px;
                }
                .step-number {
                    width: 32px;
                    height: 32px;
                    background: #22c55e;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 14px;
                }
                .step-text {
                    flex: 1;
                    color: #166534;
                }
                .footer {
                    background: #f8fafc;
                    padding: 30px;
                    text-align: center;
                    border-top: 1px solid #e2e8f0;
                }
                .footer p {
                    color: #64748b;
                    font-size: 13px;
                    margin: 5px 0;
                }
                .social-links {
                    margin-top: 15px;
                }
                .social-links a {
                    color: #667eea;
                    text-decoration: none;
                    margin: 0 10px;
                    font-size: 13px;
                }
                @media (max-width: 480px) {
                    .content {
                        padding: 25px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✨ Thank You for Reaching Out! ✨</h1>
                    <p>STR Solutions - Digital Innovation Partners</p>
                </div>
                
                <div class="content">
                    <div class="greeting">
                        Dear ${data.name},
                    </div>
                    
                    <div class="message">
                        Thank you for contacting <strong>STR Solutions Limited</strong>. We've received your message and our team is already reviewing your inquiry.
                    </div>
                    
                    <div class="info-box">
                        <div class="info-title">📋 Your Inquiry Summary</div>
                        <p style="color: #4c1d95; margin-top: 10px;">
                            <strong>Reference ID:</strong> #${Math.random().toString(36).substring(2, 10).toUpperCase()}<br>
                            <strong>Submitted:</strong> ${new Date().toLocaleString()}
                        </p>
                    </div>
                    
                    <div class="next-steps">
                        <div class="info-title" style="color: #166534;">🚀 What happens next?</div>
                        <div class="step">
                            <div class="step-number">1</div>
                            <div class="step-text">Our team will review your request within <strong>24 hours</strong></div>
                        </div>
                        <div class="step">
                            <div class="step-number">2</div>
                            <div class="step-text">You'll receive a response from our experts</div>
                        </div>
                        <div class="step">
                            <div class="step-number">3</div>
                            <div class="step-text">We'll schedule a consultation to discuss your needs</div>
                        </div>
                    </div>
                    
                    <div class="message">
                        <strong>Need immediate assistance?</strong><br>
                        Feel free to call us directly:
                    </p>
                    <p style="margin-top: 10px;">
                        📞 Bangladesh: +880 1332-802026<br>
                        📞 Europe: +39 344 7792783
                    </p>
                </div>
                
                <div class="footer">
                    <p><strong>STR Solutions Limited</strong></p>
                    <p>970 East Shewrapara, Dhaka 1216, Bangladesh</p>
                    <div class="social-links">
                        <a href="#">LinkedIn</a> • 
                        <a href="#">Facebook</a> • 
                        <a href="#">Twitter</a>
                    </div>
                    <p style="margin-top: 15px; font-size: 12px;">
                        This is an automated acknowledgment. We'll get back to you personally very soon!
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;
};

// Send contact email to admin and customer
const sendContactEmail = async (data) => {
    try {
        // Email to admin
        const adminMailOptions = {
            from: `"STR Solutions Contact" <${process.env.EMAIL_USER}>`,
            to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
            subject: `🔔 New Contact Form Submission from ${data.name}`,
            html: generateAdminEmailTemplate(data),
            replyTo: data.email,
        };

        // Email to customer (acknowledgment)
        const customerMailOptions = {
            from: `"STR Solutions" <${process.env.EMAIL_USER}>`,
            to: data.email,
            subject: "✨ Thank you for contacting STR Solutions",
            html: generateCustomerEmailTemplate(data),
        };

        // Send both emails
        await Promise.all([
            transporter.sendMail(adminMailOptions),
            transporter.sendMail(customerMailOptions),
        ]);

        console.log(`✅ Emails sent successfully to admin and ${data.email}`);
        return { success: true };
    } catch (error) {
        console.error("Email sending error:", error);
        throw new Error("Failed to send email notifications");
    }
};

module.exports = { sendContactEmail };
