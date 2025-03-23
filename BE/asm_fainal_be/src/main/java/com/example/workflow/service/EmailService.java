// EmailService.java
package com.example.workflow.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;


@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    /**
     * Gửi email chứa mã xác nhận để đặt lại mật khẩu
     * @param to Địa chỉ email người nhận
     * @param resetCode Mã xác nhận (6 chữ số)
     * @throws MessagingException Nếu có lỗi khi gửi email
     */
    public void sendPasswordResetCodeEmail(String to, String resetCode) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(to);
        helper.setSubject("Yêu cầu đặt lại mật khẩu");
        helper.setText(
            "<h1>Yêu cầu đặt lại mật khẩu</h1>" +
            "<p>Mã xác nhận của bạn là:</p>" +
            "<h2 style='color: #991b1b;'>" + resetCode + "</h2>" +
            "<p>Mã này sẽ hết hạn sau 15 phút.</p>" +
            "<p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>",
            true // Cho phép HTML
        );

        mailSender.send(message);
    }
}