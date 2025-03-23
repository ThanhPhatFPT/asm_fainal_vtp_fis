package com.example.workflow.service;

import com.example.workflow.model.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    private static final Logger logger = LoggerFactory.getLogger(JwtService.class);
    private final String secretKey;

    // Inject SECRET_KEY from application.yml
    public JwtService(@Value("${app.jwt.secret-key}") String secretKey) {
        this.secretKey = secretKey;
        logger.info("JWT Secret Key loaded successfully");
    }

    public String extractUsername(String token) {
        try {
            return extractClaim(token, Claims::getSubject);
        } catch (JwtException e) {
            logger.error("Failed to extract username from token: {}", e.getMessage());
            return null; // Or throw an exception depending on your needs
        }
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(getSignKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (ExpiredJwtException e) {
            logger.warn("Token expired: {}", e.getMessage());
            throw e; // Re-throw to handle expiration explicitly
        } catch (SignatureException e) {
            logger.error("Invalid JWT signature: {}", e.getMessage());
            throw new IllegalArgumentException("Token không hợp lệ: chữ ký không đúng");
        } catch (JwtException e) {
            logger.error("Failed to parse JWT: {}", e.getMessage());
            throw new IllegalArgumentException("Token không hợp lệ: " + e.getMessage());
        }
    }

    private Key getSignKey() {
        try {
            byte[] keyBytes = Decoders.BASE64.decode(secretKey);
            return Keys.hmacShaKeyFor(keyBytes);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid base64 secret key: {}", e.getMessage());
            throw new IllegalStateException("Khóa bí mật JWT không hợp lệ");
        }
    }

    public String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getUserId());
        claims.put("role", user.getRole());
        claims.put("status", user.getStatus());
        claims.put("fullName", user.getFullName());
        String token = createToken(claims, user.getEmail());
        logger.info("Generated JWT for user: {}", user.getEmail());
        return token;
    }

    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 24 * 7)) // 7 days expiration
                .signWith(getSignKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            boolean isValid = username != null &&
                    username.equals(userDetails.getUsername()) &&
                    !isTokenExpired(token);
            logger.debug("Token validation for {}: {}", username, isValid ? "valid" : "invalid");
            return isValid;
        } catch (ExpiredJwtException e) {
            logger.warn("Token expired for user {}: {}", userDetails.getUsername(), e.getMessage());
            return false;
        } catch (JwtException e) {
            logger.error("Token validation failed: {}", e.getMessage());
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        Date expiration = extractClaim(token, Claims::getExpiration);
        boolean expired = expiration.before(new Date());
        if (expired) {
            logger.debug("Token expired at: {}", expiration);
        }
        return expired;
    }
}