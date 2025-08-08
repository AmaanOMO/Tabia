package com.tabia;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class TabiaApplication {

    public static void main(String[] args) {
        SpringApplication.run(TabiaApplication.class, args);
    }
} 