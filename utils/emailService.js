const nodemailer = require("nodemailer");

// Create transporter with better configuration
const createTransporter = () => {
    // Check if credentials exist
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error("Email credentials missing! Please check your .env file");
        return null;
    }

    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false,
        },
        connectionTimeout: 10000,
    });
};

//! Send contact form email to admin
const sendContactEmail = async (contactData) => {
    const { name, email, message, phone } = contactData;

    const transporter = createTransporter();
    if (!transporter) {
        console.error("Email service not configured");
        return;
    }

    const mailOptions = {
        from: `"Neela's Law Firm" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
        subject: `📬 New Contact Message from ${name}`,
        html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>New Contact Message</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        margin: 0;
                        padding: 20px;
                    }
                    .email-container {
                        max-width: 600px;
                        margin: 0 auto;
                        background: #ffffff;
                        border-radius: 20px;
                        overflow: hidden;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                        animation: slideIn 0.5s ease-out;
                    }
                    @keyframes slideIn {
                        from {
                            opacity: 0;
                            transform: translateY(-30px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    .header {
                        background: linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 100%);
                        padding: 30px;
                        text-align: center;
                        position: relative;
                        overflow: hidden;
                    }
                    .header::before {
                        content: '';
                        position: absolute;
                        top: -50%;
                        right: -50%;
                        width: 200%;
                        height: 200%;
                        background: radial-gradient(circle, rgba(201,160,61,0.1) 0%, transparent 70%);
                        animation: pulse 3s ease-in-out infinite;
                    }
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); opacity: 0.5; }
                        50% { transform: scale(1.1); opacity: 0.8; }
                    }
                    .logo {
                        font-size: 32px;
                        font-weight: bold;
                        color: #ffffff;
                        position: relative;
                        z-index: 1;
                    }
                    .logo span {
                        color: #c9a03d;
                    }
                    .header-subtitle {
                        color: #c9a03d;
                        font-size: 14px;
                        margin-top: 8px;
                        position: relative;
                        z-index: 1;
                    }
                    .content {
                        padding: 40px;
                    }
                    .greeting {
                        font-size: 24px;
                        color: #1a1a1a;
                        margin-bottom: 20px;
                        font-weight: 600;
                    }
                    .message-card {
                        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                        border-radius: 15px;
                        padding: 25px;
                        margin: 20px 0;
                        border-left: 4px solid #c9a03d;
                    }
                    .info-row {
                        display: flex;
                        align-items: center;
                        padding: 12px 0;
                        border-bottom: 1px solid #dee2e6;
                    }
                    .info-row:last-child {
                        border-bottom: none;
                    }
                    .info-icon {
                        width: 40px;
                        font-size: 20px;
                    }
                    .info-label {
                        width: 100px;
                        font-weight: 600;
                        color: #495057;
                    }
                    .info-value {
                        flex: 1;
                        color: #212529;
                    }
                    .message-content {
                        background: #ffffff;
                        border-radius: 12px;
                        padding: 20px;
                        margin-top: 15px;
                        border: 1px solid #e9ecef;
                        font-style: italic;
                        line-height: 1.8;
                        color: #495057;
                    }
                    .badge {
                        display: inline-block;
                        background: #c9a03d;
                        color: #1a1a1a;
                        padding: 5px 12px;
                        border-radius: 20px;
                        font-size: 12px;
                        font-weight: 600;
                        margin-bottom: 15px;
                    }
                    .footer {
                        background: #1a1a1a;
                        padding: 30px;
                        text-align: center;
                    }
                    .footer-text {
                        color: #999;
                        font-size: 12px;
                        line-height: 1.5;
                    }
                    .social-links {
                        margin-top: 15px;
                    }
                    .social-links a {
                        color: #c9a03d;
                        text-decoration: none;
                        margin: 0 10px;
                        font-size: 14px;
                    }
                    .button {
                        display: inline-block;
                        background: #c9a03d;
                        color: #000000;
                        padding: 10px 20px;
                        border-radius: 8px;
                        text-decoration: none;
                        font-weight: 600;
                        margin-top: 15px;
                        transition: all 0.3s;
                    }
                    .button:hover {
                        background: #b38f2e;
                        transform: translateY(-2px);
                    }
                    @media (max-width: 600px) {
                        .content { padding: 20px; }
                        .info-row { flex-direction: column; align-items: flex-start; gap: 5px; }
                        .info-label { width: auto; }
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <div class="logo">
                            Neela's <span>Law Firm</span>
                        </div>
                        <div class="header-subtitle">Professional Legal Services</div>
                    </div>
                    
                    <div class="content">
                        <div class="badge">📬 New Contact Form Submission</div>
                        
                        <div class="greeting">
                            Hello Team,
                        </div>
                        
                        <p style="color: #6c757d; margin-bottom: 20px;">
                            You have received a new contact message from a potential client. 
                            Please review the details below and respond promptly.
                        </p>
                        
                        <div class="message-card">
                            <div class="info-row">
                                <div class="info-icon">👤</div>
                                <div class="info-label">Full Name:</div>
                                <div class="info-value"><strong>${name}</strong></div>
                            </div>
                            <div class="info-row">
                                <div class="info-icon">📧</div>
                                <div class="info-label">Email Address:</div>
                                <div class="info-value"><a href="mailto:${email}" style="color: #c9a03d;">${email}</a></div>
                            </div>
                            ${
                                phone
                                    ? `
                            <div class="info-row">
                                <div class="info-icon">📞</div>
                                <div class="info-label">Phone Number:</div>
                                <div class="info-value"><a href="tel:${phone}" style="color: #c9a03d;">${phone}</a></div>
                            </div>
                            `
                                    : ""
                            }
                            <div class="info-row">
                                <div class="info-icon">⏰</div>
                                <div class="info-label">Received:</div>
                                <div class="info-value">${new Date().toLocaleString()}</div>
                            </div>
                        </div>
                        
                        <div style="margin-top: 20px;">
                            <div style="font-weight: 600; margin-bottom: 10px; color: #1a1a1a;">💬 Message:</div>
                            <div class="message-content">
                                "${message}"
                            </div>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="mailto:${email}" class="button">Reply to Client</a>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <div class="footer-text">
                            <p>© ${new Date().getFullYear()} Neela's Law Firm. All rights reserved.</p>
                            <p>House 123, Road 4, Block B, Banani, Dhaka-1213</p>
                            <p>📞 +880 1234 567890 | 📧 info@neelaslawfirm.com</p>
                        </div>
                        <div class="social-links">
                            <a href="#">Facebook</a> | 
                            <a href="#">LinkedIn</a> | 
                            <a href="#">Twitter</a>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("Contact email sent successfully");
    } catch (error) {
        console.error("Error sending contact email:", error);
    }
};

//! Send booking email to admin
const sendBookingEmail = async (bookingData) => {
    const { name, email, phone, date, time, message } = bookingData;

    const transporter = createTransporter();
    if (!transporter) {
        console.error("Email service not configured");
        return;
    }

    const mailOptions = {
        from: `"Neela's Law Firm" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
        subject: `📅 New Consultation Booking from ${name}`,
        html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>New Consultation Booking</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        margin: 0;
                        padding: 20px;
                    }
                    .email-container {
                        max-width: 600px;
                        margin: 0 auto;
                        background: #ffffff;
                        border-radius: 20px;
                        overflow: hidden;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                        animation: slideIn 0.5s ease-out;
                    }
                    @keyframes slideIn {
                        from {
                            opacity: 0;
                            transform: translateY(-30px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    .header {
                        background: linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 100%);
                        padding: 30px;
                        text-align: center;
                        position: relative;
                        overflow: hidden;
                    }
                    .header::before {
                        content: '';
                        position: absolute;
                        top: -50%;
                        right: -50%;
                        width: 200%;
                        height: 200%;
                        background: radial-gradient(circle, rgba(201,160,61,0.15) 0%, transparent 70%);
                        animation: pulse 3s ease-in-out infinite;
                    }
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); opacity: 0.5; }
                        50% { transform: scale(1.1); opacity: 0.8; }
                    }
                    .logo {
                        font-size: 32px;
                        font-weight: bold;
                        color: #ffffff;
                        position: relative;
                        z-index: 1;
                    }
                    .logo span {
                        color: #c9a03d;
                    }
                    .header-subtitle {
                        color: #c9a03d;
                        font-size: 14px;
                        margin-top: 8px;
                        position: relative;
                        z-index: 1;
                    }
                    .content {
                        padding: 40px;
                    }
                    .badge {
                        display: inline-block;
                        background: #c9a03d;
                        color: #1a1a1a;
                        padding: 5px 12px;
                        border-radius: 20px;
                        font-size: 12px;
                        font-weight: 600;
                        margin-bottom: 15px;
                    }
                    .greeting {
                        font-size: 24px;
                        color: #1a1a1a;
                        margin-bottom: 20px;
                        font-weight: 600;
                    }
                    .appointment-card {
                        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                        border-radius: 15px;
                        padding: 25px;
                        margin: 20px 0;
                        border: 2px solid #c9a03d;
                        position: relative;
                        overflow: hidden;
                    }
                    .appointment-card::before {
                        content: '📅';
                        position: absolute;
                        top: -20px;
                        right: -20px;
                        font-size: 80px;
                        opacity: 0.1;
                        transform: rotate(15deg);
                    }
                    .info-row {
                        display: flex;
                        align-items: center;
                        padding: 12px 0;
                        border-bottom: 1px solid #dee2e6;
                    }
                    .info-row:last-child {
                        border-bottom: none;
                    }
                    .info-icon {
                        width: 45px;
                        font-size: 22px;
                    }
                    .info-label {
                        width: 110px;
                        font-weight: 600;
                        color: #495057;
                    }
                    .info-value {
                        flex: 1;
                        color: #212529;
                        font-weight: 500;
                    }
                    .date-time {
                        display: inline-block;
                        background: #1a1a1a;
                        color: #c9a03d;
                        padding: 8px 16px;
                        border-radius: 10px;
                        font-weight: 600;
                    }
                    .message-content {
                        background: #ffffff;
                        border-radius: 12px;
                        padding: 20px;
                        margin-top: 15px;
                        border: 1px solid #e9ecef;
                        font-style: italic;
                        line-height: 1.8;
                        color: #495057;
                    }
                    .action-buttons {
                        display: flex;
                        gap: 15px;
                        justify-content: center;
                        margin-top: 25px;
                        margin-bottom: 25px;
                    }
                    .btn-confirm {
                        background: #28a745;
                        color: #ffffff;
                        padding: 10px 20px;
                        border-radius: 8px;
                        text-decoration: none;
                        font-weight: 600;
                        transition: all 0.3s;
                    }
                    .btn-confirm:hover {
                        background: #218838;
                        transform: translateY(-2px);
                    }
                    .btn-reschedule {
                        background: #ffc107;
                        color: #000000;
                        padding: 10px 20px;
                        border-radius: 8px;
                        text-decoration: none;
                        font-weight: 600;
                        transition: all 0.3s;
                    }
                    .btn-reschedule:hover {
                        background: #e0a800;
                        transform: translateY(-2px);
                    }
                    .footer {
                        background: #1a1a1a;
                        padding: 30px;
                        text-align: center;
                    }
                    .footer-text {
                        color: #999;
                        font-size: 12px;
                        line-height: 1.5;
                    }
                    .social-links {
                        margin-top: 15px;
                    }
                    .social-links a {
                        color: #c9a03d;
                        text-decoration: none;
                        margin: 0 10px;
                        font-size: 14px;
                    }
                    @media (max-width: 600px) {
                        .content { padding: 20px; }
                        .info-row { flex-direction: column; align-items: flex-start; gap: 5px; }
                        .info-label { width: auto; }
                        .action-buttons { flex-direction: column; }
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <div class="logo">
                            Neela's <span>Law Firm</span>
                        </div>
                        <div class="header-subtitle">Professional Legal Services</div>
                    </div>
                    
                    <div class="content">
                        <div class="badge">📋 New Consultation Request</div>
                        
                        <div class="greeting">
                            🎯 New Booking Alert!
                        </div>
                        
                        <p style="color: #6c757d; margin-bottom: 20px;">
                            A potential client has requested a consultation. Please review the appointment details below.
                        </p>
                        
                        <div class="appointment-card">
                            <div class="info-row">
                                <div class="info-icon">👤</div>
                                <div class="info-label">Client Name:</div>
                                <div class="info-value"><strong>${name}</strong></div>
                            </div>
                            <div class="info-row">
                                <div class="info-icon">📧</div>
                                <div class="info-label">Email:</div>
                                <div class="info-value"><a href="mailto:${email}" style="color: #c9a03d;">${email}</a></div>
                            </div>
                            <div class="info-row">
                                <div class="info-icon">📞</div>
                                <div class="info-label">Phone:</div>
                                <div class="info-value"><a href="tel:${phone}" style="color: #c9a03d;">${phone}</a></div>
                            </div>
                            <div class="info-row">
                                <div class="info-icon">📅</div>
                                <div class="info-label">Date:</div>
                                <div class="info-value"><span class="date-time">${new Date(date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span></div>
                            </div>
                            <div class="info-row">
                                <div class="info-icon">⏰</div>
                                <div class="info-label">Time:</div>
                                <div class="info-value"><span class="date-time">${time}</span></div>
                            </div>
                            <div class="info-row">
                                <div class="info-icon">🆔</div>
                                <div class="info-label">Booking ID:</div>
                                <div class="info-value"><code style="background: #e9ecef; padding: 2px 6px; border-radius: 4px;">#${Math.random().toString(36).substring(2, 10).toUpperCase()}</code></div>
                            </div>
                        </div>
                        
                        ${
                            message
                                ? `
                        <div style="margin-top: 20px;">
                            <div style="font-weight: 600; margin-bottom: 10px; color: #1a1a1a;">💬 Additional Notes from Client:</div>
                            <div class="message-content">
                                "${message}"
                            </div>
                        </div>
                        `
                                : ""
                        }
                        
                        <div class="action-buttons">
                            <a href="mailto:${email}?subject=Consultation Confirmation - Neela's Law Firm" class="btn-confirm">✓ Confirm Booking</a>
                            <a href="tel:${phone}" class="btn-reschedule">📞 Call Client</a>
                        </div>
                        
                        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 8px; margin-top: 20px;">
                            <div style="font-weight: 600; margin-bottom: 5px;">⚠️ Next Steps:</div>
                            <ul style="margin-left: 20px; color: #856404; font-size: 13px;">
                                <li>Contact the client to confirm the appointment</li>
                                <li>Prepare necessary consultation forms</li>
                                <li>Send a confirmation email with details</li>
                                <li>Update the booking status in the system</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <div class="footer-text">
                            <p>© ${new Date().getFullYear()} Neela's Law Firm. All rights reserved.</p>
                            <p>House 123, Road 4, Block B, Banani, Dhaka-1213</p>
                            <p>📞 +880 1234 567890 | 📧 info@neelaslawfirm.com</p>
                        </div>
                        <div class="social-links">
                            <a href="#">Facebook</a> | 
                            <a href="#">LinkedIn</a> | 
                            <a href="#">Twitter</a>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("Booking email sent successfully");
    } catch (error) {
        console.error("Error sending booking email:", error);
    }
};

//! Send booking confirmation email to client
const sendBookingConfirmationEmail = async (bookingData) => {
    const { name, email, phone, date, time, message } = bookingData;

    const transporter = createTransporter();
    if (!transporter) {
        console.error("Email service not configured");
        return;
    }

    const mailOptions = {
        from: `"Neela's Law Firm" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `✅ Consultation Confirmed - Neela's Law Firm`,
        html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Booking Confirmed</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        margin: 0;
                        padding: 20px;
                    }
                    .email-container {
                        max-width: 600px;
                        margin: 0 auto;
                        background: #ffffff;
                        border-radius: 20px;
                        overflow: hidden;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                        animation: slideIn 0.5s ease-out;
                    }
                    @keyframes slideIn {
                        from {
                            opacity: 0;
                            transform: translateY(-30px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    .header {
                        background: linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 100%);
                        padding: 30px;
                        text-align: center;
                        position: relative;
                        overflow: hidden;
                    }
                    .header::before {
                        content: '';
                        position: absolute;
                        top: -50%;
                        right: -50%;
                        width: 200%;
                        height: 200%;
                        background: radial-gradient(circle, rgba(76, 175, 80, 0.15) 0%, transparent 70%);
                        animation: pulse 3s ease-in-out infinite;
                    }
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); opacity: 0.5; }
                        50% { transform: scale(1.1); opacity: 0.8; }
                    }
                    .logo {
                        font-size: 32px;
                        font-weight: bold;
                        color: #ffffff;
                        position: relative;
                        z-index: 1;
                    }
                    .logo span {
                        color: #4caf50;
                    }
                    .header-subtitle {
                        color: #4caf50;
                        font-size: 14px;
                        margin-top: 8px;
                        position: relative;
                        z-index: 1;
                    }
                    .content {
                        padding: 40px;
                    }
                    .success-badge {
                        display: inline-block;
                        background: #4caf50;
                        color: #ffffff;
                        padding: 8px 20px;
                        border-radius: 30px;
                        font-size: 14px;
                        font-weight: 600;
                        margin-bottom: 20px;
                        text-align: center;
                    }
                    .greeting {
                        font-size: 24px;
                        color: #1a1a1a;
                        margin-bottom: 20px;
                        font-weight: 600;
                    }
                    .message {
                        color: #6c757d;
                        margin-bottom: 25px;
                        line-height: 1.8;
                    }
                    .appointment-card {
                        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                        border-radius: 15px;
                        padding: 25px;
                        margin: 25px 0;
                        border: 2px solid #4caf50;
                        position: relative;
                        overflow: hidden;
                    }
                    .appointment-card::before {
                        content: '✓✓';
                        position: absolute;
                        top: -20px;
                        right: -20px;
                        font-size: 80px;
                        opacity: 0.08;
                        transform: rotate(15deg);
                        color: #4caf50;
                    }
                    .info-row {
                        display: flex;
                        align-items: center;
                        padding: 12px 0;
                        border-bottom: 1px solid #dee2e6;
                    }
                    .info-row:last-child {
                        border-bottom: none;
                    }
                    .info-icon {
                        width: 45px;
                        font-size: 22px;
                    }
                    .info-label {
                        width: 110px;
                        font-weight: 600;
                        color: #495057;
                    }
                    .info-value {
                        flex: 1;
                        color: #212529;
                        font-weight: 500;
                    }
                    .date-time {
                        display: inline-block;
                        background: #4caf50;
                        color: #ffffff;
                        padding: 8px 16px;
                        border-radius: 10px;
                        font-weight: 600;
                    }
                    .preparation-list {
                        background: #e8f5e9;
                        border-radius: 12px;
                        padding: 20px;
                        margin: 20px 0;
                    }
                    .preparation-list h4 {
                        color: #2e7d32;
                        margin-bottom: 12px;
                    }
                    .preparation-list ul {
                        margin-left: 20px;
                        color: #1b5e20;
                    }
                    .preparation-list li {
                        margin: 8px 0;
                    }
                    .button {
                        display: inline-block;
                        background: #4caf50;
                        color: #ffffff;
                        padding: 12px 30px;
                        border-radius: 8px;
                        text-decoration: none;
                        font-weight: 600;
                        margin: 20px 0;
                        transition: all 0.3s;
                    }
                    .button:hover {
                        background: #388e3c;
                        transform: translateY(-2px);
                    }
                    .footer {
                        background: #1a1a1a;
                        padding: 30px;
                        text-align: center;
                    }
                    .footer-text {
                        color: #999;
                        font-size: 12px;
                        line-height: 1.5;
                    }
                    .social-links {
                        margin-top: 15px;
                    }
                    .social-links a {
                        color: #4caf50;
                        text-decoration: none;
                        margin: 0 10px;
                        font-size: 14px;
                    }
                    @media (max-width: 600px) {
                        .content { padding: 20px; }
                        .info-row { flex-direction: column; align-items: flex-start; gap: 5px; }
                        .info-label { width: auto; }
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <div class="logo">
                            Neela's <span>Law Firm</span>
                        </div>
                        <div class="header-subtitle">Professional Legal Services</div>
                    </div>
                    
                    <div class="content">
                        <div style="text-align: center;">
                            <div class="success-badge">✓ CONFIRMED ✓</div>
                        </div>
                        
                        <div class="greeting">
                            Dear ${name},
                        </div>
                        
                        <div class="message">
                            Great news! Your consultation request has been <strong>CONFIRMED</strong>. 
                            We're looking forward to assisting you with your legal matter.
                        </div>
                        
                        <div class="appointment-card">
                            <div class="info-row">
                                <div class="info-icon">📅</div>
                                <div class="info-label">Date:</div>
                                <div class="info-value"><span class="date-time">${new Date(date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span></div>
                            </div>
                            <div class="info-row">
                                <div class="info-icon">⏰</div>
                                <div class="info-label">Time:</div>
                                <div class="info-value"><span class="date-time">${time}</span></div>
                            </div>
                            <div class="info-row">
                                <div class="info-icon">📍</div>
                                <div class="info-label">Location:</div>
                                <div class="info-value">House 123, Road 4, Block B, Banani, Dhaka-1213</div>
                            </div>
                            <div class="info-row">
                                <div class="info-icon">📞</div>
                                <div class="info-label">Contact:</div>
                                <div class="info-value">+880 1234 567890</div>
                            </div>
                        </div>
                        
                        <div class="preparation-list">
                            <h4>📋 What to Bring / Prepare:</h4>
                            <ul>
                                <li>Any relevant documents related to your case</li>
                                <li>National ID / Passport for identification</li>
                                <li>Previous correspondence or court papers (if any)</li>
                                <li>List of questions you want to ask</li>
                                <li>Notepad and pen for taking notes</li>
                            </ul>
                        </div>
                        
                        <div class="message">
                            <strong>📍 Important Information:</strong><br>
                            • Please arrive 10 minutes before your scheduled time<br>
                            • Free parking is available at our premises<br>
                            • If you need to reschedule, please contact us 24 hours in advance<br>
                            • Virtual consultation is available upon request
                        </div>
                        
                        <div style="text-align: center;">
                            <a href="https://maps.google.com/?q=Banani,Dhaka" class="button">📍 Get Directions</a>
                        </div>
                        
                        <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; border-radius: 8px; margin-top: 20px;">
                            <div style="font-weight: 600; margin-bottom: 5px; color: #1565c0;">💡 Need to Reschedule?</div>
                            <p style="color: #1565c0; font-size: 13px;">Contact us at least 24 hours before your appointment to reschedule without any charges.</p>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <div class="footer-text">
                            <p>© ${new Date().getFullYear()} Neela's Law Firm. All rights reserved.</p>
                            <p>House 123, Road 4, Block B, Banani, Dhaka-1213</p>
                            <p>📞 +880 1234 567890 | 📧 info@neelaslawfirm.com</p>
                        </div>
                        <div class="social-links">
                            <a href="#">Facebook</a> | 
                            <a href="#">LinkedIn</a> | 
                            <a href="#">Twitter</a>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Booking confirmation email sent to ${email}`);
    } catch (error) {
        console.error("Error sending booking confirmation email:", error);
    }
};

//! Send booking cancellation email to client
const sendBookingCancellationEmail = async (bookingData) => {
    const { name, email, phone, date, time, message, reason } = bookingData;

    const transporter = createTransporter();
    if (!transporter) {
        console.error("Email service not configured");
        return;
    }

    const mailOptions = {
        from: `"Neela's Law Firm" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `❌ Consultation Cancelled - Neela's Law Firm`,
        html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Booking Cancelled</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        margin: 0;
                        padding: 20px;
                    }
                    .email-container {
                        max-width: 600px;
                        margin: 0 auto;
                        background: #ffffff;
                        border-radius: 20px;
                        overflow: hidden;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                        animation: slideIn 0.5s ease-out;
                    }
                    @keyframes slideIn {
                        from {
                            opacity: 0;
                            transform: translateY(-30px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    .header {
                        background: linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 100%);
                        padding: 30px;
                        text-align: center;
                        position: relative;
                        overflow: hidden;
                    }
                    .header::before {
                        content: '';
                        position: absolute;
                        top: -50%;
                        right: -50%;
                        width: 200%;
                        height: 200%;
                        background: radial-gradient(circle, rgba(244, 67, 54, 0.15) 0%, transparent 70%);
                        animation: pulse 3s ease-in-out infinite;
                    }
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); opacity: 0.5; }
                        50% { transform: scale(1.1); opacity: 0.8; }
                    }
                    .logo {
                        font-size: 32px;
                        font-weight: bold;
                        color: #ffffff;
                        position: relative;
                        z-index: 1;
                    }
                    .logo span {
                        color: #f44336;
                    }
                    .header-subtitle {
                        color: #f44336;
                        font-size: 14px;
                        margin-top: 8px;
                        position: relative;
                        z-index: 1;
                    }
                    .content {
                        padding: 40px;
                    }
                    .cancelled-badge {
                        display: inline-block;
                        background: #f44336;
                        color: #ffffff;
                        padding: 8px 20px;
                        border-radius: 30px;
                        font-size: 14px;
                        font-weight: 600;
                        margin-bottom: 20px;
                        text-align: center;
                    }
                    .greeting {
                        font-size: 24px;
                        color: #1a1a1a;
                        margin-bottom: 20px;
                        font-weight: 600;
                    }
                    .message {
                        color: #6c757d;
                        margin-bottom: 25px;
                        line-height: 1.8;
                    }
                    .appointment-card {
                        background: linear-gradient(135deg, #fff5f5 0%, #fee 100%);
                        border-radius: 15px;
                        padding: 25px;
                        margin: 25px 0;
                        border: 2px solid #f44336;
                        position: relative;
                        overflow: hidden;
                    }
                    .appointment-card::before {
                        content: '❌❌';
                        position: absolute;
                        top: -20px;
                        right: -20px;
                        font-size: 80px;
                        opacity: 0.08;
                        transform: rotate(15deg);
                        color: #f44336;
                    }
                    .info-row {
                        display: flex;
                        align-items: center;
                        padding: 12px 0;
                        border-bottom: 1px solid #dee2e6;
                    }
                    .info-row:last-child {
                        border-bottom: none;
                    }
                    .info-icon {
                        width: 45px;
                        font-size: 22px;
                    }
                    .info-label {
                        width: 110px;
                        font-weight: 600;
                        color: #495057;
                    }
                    .info-value {
                        flex: 1;
                        color: #212529;
                        font-weight: 500;
                    }
                    .date-time-cancelled {
                        display: inline-block;
                        background: #f44336;
                        color: #ffffff;
                        padding: 8px 16px;
                        border-radius: 10px;
                        font-weight: 600;
                        text-decoration: line-through;
                    }
                    .alternative-options {
                        background: #fff3e0;
                        border-radius: 12px;
                        padding: 20px;
                        margin: 20px 0;
                        border-left: 4px solid #ff9800;
                    }
                    .alternative-options h4 {
                        color: #e65100;
                        margin-bottom: 12px;
                    }
                    .alternative-options ul {
                        margin-left: 20px;
                        color: #bf360c;
                    }
                    .alternative-options li {
                        margin: 8px 0;
                    }
                    .button {
                        display: inline-block;
                        background: #f44336;
                        color: #ffffff;
                        padding: 12px 30px;
                        border-radius: 8px;
                        text-decoration: none;
                        font-weight: 600;
                        margin: 20px 0;
                        transition: all 0.3s;
                    }
                    .button-reschedule {
                        display: inline-block;
                        background: #ff9800;
                        color: #ffffff;
                        padding: 12px 30px;
                        border-radius: 8px;
                        text-decoration: none;
                        font-weight: 600;
                        margin: 20px 10px;
                        transition: all 0.3s;
                    }
                    .button:hover {
                        background: #d32f2f;
                        transform: translateY(-2px);
                    }
                    .button-reschedule:hover {
                        background: #f57c00;
                        transform: translateY(-2px);
                    }
                    .footer {
                        background: #1a1a1a;
                        padding: 30px;
                        text-align: center;
                    }
                    .footer-text {
                        color: #999;
                        font-size: 12px;
                        line-height: 1.5;
                    }
                    .social-links {
                        margin-top: 15px;
                    }
                    .social-links a {
                        color: #f44336;
                        text-decoration: none;
                        margin: 0 10px;
                        font-size: 14px;
                    }
                    @media (max-width: 600px) {
                        .content { padding: 20px; }
                        .info-row { flex-direction: column; align-items: flex-start; gap: 5px; }
                        .info-label { width: auto; }
                        .button-reschedule { display: block; margin: 10px 0; }
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <div class="logo">
                            Neela's <span>Law Firm</span>
                        </div>
                        <div class="header-subtitle">Professional Legal Services</div>
                    </div>
                    
                    <div class="content">
                        <div style="text-align: center;">
                            <div class="cancelled-badge">✗ CANCELLED ✗</div>
                        </div>
                        
                        <div class="greeting">
                            Dear ${name},
                        </div>
                        
                        <div class="message">
                            We regret to inform you that your consultation has been <strong>CANCELLED</strong>.
                            ${reason ? `<br><br><strong>Reason for cancellation:</strong> ${reason}` : ""}
                        </div>
                        
                        <div class="appointment-card">
                            <div class="info-row">
                                <div class="info-icon">📅</div>
                                <div class="info-label">Original Date:</div>
                                <div class="info-value"><span class="date-time-cancelled">${new Date(date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span></div>
                            </div>
                            <div class="info-row">
                                <div class="info-icon">⏰</div>
                                <div class="info-label">Original Time:</div>
                                <div class="info-value"><span class="date-time-cancelled">${time}</span></div>
                            </div>
                        </div>
                        
                        <div class="alternative-options">
                            <h4>🔄 What You Can Do Next:</h4>
                            <ul>
                                <li><strong>Reschedule:</strong> Book a new consultation at your convenience</li>
                                <li><strong>Phone Consultation:</strong> Request a telephonic consultation instead</li>
                                <li><strong>Emergency Support:</strong> Call our emergency helpline for urgent matters</li>
                                <li><strong>Email Support:</strong> Send your queries to our legal team</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center;">
                            <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/booking" class="button-reschedule">📅 Reschedule Now</a>
                            <a href="tel:+8801234567890" class="button">📞 Call Support</a>
                        </div>
                        
                        <div style="background: #ffebee; border-left: 4px solid #f44336; padding: 15px; border-radius: 8px; margin-top: 20px;">
                            <div style="font-weight: 600; margin-bottom: 5px; color: #c62828;">💬 Need Immediate Assistance?</div>
                            <p style="color: #c62828; font-size: 13px;">Our support team is available 24/7 to help you. Call us at +880 1234 567890 or email support@neelaslawfirm.com</p>
                        </div>
                        
                        <div class="message" style="margin-top: 20px; font-size: 13px;">
                            <strong>Note:</strong> If this cancellation was made in error, please contact us immediately to restore your booking.
                        </div>
                    </div>
                    
                    <div class="footer">
                        <div class="footer-text">
                            <p>© ${new Date().getFullYear()} Neela's Law Firm. All rights reserved.</p>
                            <p>House 123, Road 4, Block B, Banani, Dhaka-1213</p>
                            <p>📞 +880 1234 567890 | 📧 info@neelaslawfirm.com</p>
                        </div>
                        <div class="social-links">
                            <a href="#">Facebook</a> | 
                            <a href="#">LinkedIn</a> | 
                            <a href="#">Twitter</a>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Booking cancellation email sent to ${email}`);
    } catch (error) {
        console.error("Error sending booking cancellation email:", error);
    }
};

//! Send password reset email
const sendPasswordResetEmail = async (email, resetToken, name) => {
    const transporter = createTransporter();
    if (!transporter) {
        console.error("Email service not configured");
        // Don't throw error, just log and return
        return;
    }

    const resetUrl = `${process.env.FRONTEND_URL}/admin/reset-password?token=${resetToken}`;

    const mailOptions = {
        from: `"Neela's Law Firm" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Password Reset Request - Neela's Law Firm",
        html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Reset</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        margin: 0;
                        padding: 0;
                        background-color: #f5f5f5;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #ffffff;
                        border-radius: 12px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    }
                    .header {
                        text-align: center;
                        padding: 20px 0;
                        border-bottom: 2px solid #c9a03d;
                    }
                    .logo {
                        font-size: 28px;
                        font-weight: bold;
                        color: #1a1a1a;
                    }
                    .logo span {
                        color: #c9a03d;
                    }
                    .content {
                        padding: 30px 20px;
                    }
                    .greeting {
                        font-size: 18px;
                        margin-bottom: 20px;
                    }
                    .message {
                        margin-bottom: 25px;
                        color: #555;
                    }
                    .token-box {
                        background-color: #f8f9fa;
                        border-left: 4px solid #c9a03d;
                        padding: 15px;
                        margin: 20px 0;
                        text-align: center;
                        font-size: 32px;
                        font-weight: bold;
                        letter-spacing: 5px;
                        font-family: monospace;
                        border-radius: 8px;
                    }
                    .button {
                        display: inline-block;
                        background-color: #c9a03d;
                        color: #1a1a1a;
                        text-decoration: none;
                        padding: 12px 30px;
                        border-radius: 6px;
                        font-weight: 600;
                        margin: 20px 0;
                        transition: background-color 0.3s;
                    }
                    .button:hover {
                        background-color: #b38f2e;
                    }
                    .footer {
                        text-align: center;
                        padding-top: 20px;
                        border-top: 1px solid #eee;
                        font-size: 12px;
                        color: #999;
                    }
                    .warning {
                        background-color: #fff3cd;
                        border: 1px solid #ffeaa7;
                        padding: 12px;
                        border-radius: 6px;
                        margin: 20px 0;
                        font-size: 13px;
                        color: #856404;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">
                            Neela's <span>Law Firm</span>
                        </div>
                        <p style="margin-top: 5px; color: #666;">Professional Legal Services</p>
                    </div>
                    
                    <div class="content">
                        <div class="greeting">
                            Dear <strong>${name}</strong>,
                        </div>
                        
                        <div class="message">
                            We received a request to reset the password for your admin account. 
                            Please use the verification code below to reset your password.
                        </div>
                        
                        <div class="token-box">
                            ${resetToken}
                        </div>
                        
                        <div class="message">
                            This verification code will expire in <strong>10 minutes</strong>.
                            If you didn't request a password reset, please ignore this email.
                        </div>
                        
                        <div class="warning">
                            ⚠️ <strong>Security Notice:</strong> Never share this code with anyone. 
                            Our team will never ask for this code.
                        </div>
                        
                        <div style="text-align: center;">
                            <a href="${resetUrl}" class="button">Reset Password</a>
                        </div>
                        
                        <div class="message" style="font-size: 14px; text-align: center;">
                            Or copy and paste this link in your browser:<br>
                            <a href="${resetUrl}" style="color: #c9a03d; word-break: break-all;">${resetUrl}</a>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} Neela's Law Firm. All rights reserved.</p>
                        <p>House 123, Road 4, Block B, Banani, Dhaka-1213</p>
                        <p>This is an automated message, please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to ${email}`);
    } catch (error) {
        console.error("Error sending password reset email:", error);
        // Don't throw error to avoid exposing email configuration issues
    }
};

//! Send password change confirmation email
const sendPasswordChangeConfirmation = async (email, name) => {
    const transporter = createTransporter();
    if (!transporter) {
        console.error("Email service not configured");
        return;
    }

    const mailOptions = {
        from: `"Neela's Law Firm" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Password Changed Successfully - Neela's Law Firm",
        html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Changed</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        margin: 0;
                        padding: 0;
                        background-color: #f5f5f5;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #ffffff;
                        border-radius: 12px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    }
                    .header {
                        text-align: center;
                        padding: 20px 0;
                        border-bottom: 2px solid #c9a03d;
                    }
                    .logo {
                        font-size: 28px;
                        font-weight: bold;
                        color: #1a1a1a;
                    }
                    .logo span {
                        color: #c9a03d;
                    }
                    .content {
                        padding: 30px 20px;
                        text-align: center;
                    }
                    .success-icon {
                        font-size: 64px;
                        margin-bottom: 20px;
                    }
                    .footer {
                        text-align: center;
                        padding-top: 20px;
                        border-top: 1px solid #eee;
                        font-size: 12px;
                        color: #999;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">
                            Neela's <span>Law Firm</span>
                        </div>
                    </div>
                    <div class="content">
                        <div class="success-icon">🔐</div>
                        <h2>Password Changed Successfully</h2>
                        <p>Dear <strong>${name}</strong>,</p>
                        <p>Your password has been successfully changed.</p>
                        <p>If you did not make this change, please contact our support team immediately.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} Neela's Law Firm. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Password change confirmation email sent to ${email}`);
    } catch (error) {
        console.error("Error sending password change confirmation email:", error);
    }
};

module.exports = {
    sendContactEmail,
    sendBookingEmail,
    sendBookingConfirmationEmail,
    sendBookingCancellationEmail,
    sendPasswordResetEmail,
    sendPasswordChangeConfirmation,
};
