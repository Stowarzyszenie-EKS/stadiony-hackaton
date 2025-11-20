package com.example.demo

import io.kotest.matchers.shouldBe
import org.springframework.boot.test.web.client.TestRestTemplate

class HelloControllerSpec(
    private val restTemplate: TestRestTemplate
) : BaseFunctionalSpec({

    "GET /hello returns Hello World with full Spring context" {
        val response = restTemplate.getForEntity("/hello", String::class.java)
        response.statusCode.value() shouldBe 200
        response.body!!.contains("Hello World") shouldBe true
    }
})
