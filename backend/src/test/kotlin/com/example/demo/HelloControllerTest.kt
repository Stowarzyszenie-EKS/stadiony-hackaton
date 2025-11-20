package com.example.demo

import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.setup.MockMvcBuilders

class HelloControllerTest : StringSpec({
    val mockMvc = MockMvcBuilders.standaloneSetup(HelloController()).build()

    "GET /hello returns Hello World" {
        val result = mockMvc.get("/hello").andReturn()
        result.response.status shouldBe 200
        result.response.contentAsString.contains("Hello World") shouldBe true
    }
})