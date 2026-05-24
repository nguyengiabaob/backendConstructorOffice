import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER!,
    pass: process.env.MAIL_PASS!,
  },
});

export const sendSetupPasswordEmail = async (
  email: string,
  token: string,
): Promise<void> => {
  const link = `${process.env.FRONTEND_URL}/setup-password?token=${token}`;

  await transporter.sendMail({
    from: '"Support" <support@classmanagementapp.com>',
    to: email,
    subject: "Set your password",
    html: `
      <p>Hello,${email}</p>
      <p>Click the link below to set your password:</p>
      <a href="${link}">${link}</a>
      <p>This link expires in 24 hours.</p>
    `,
  });
};
