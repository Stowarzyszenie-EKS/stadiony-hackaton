package com.example.demo

import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe

class HelloControllerTest : StringSpec({
    val controller = HelloController()

    "GET /hello returns Hello World" {
        controller.hello() shouldBe "Hello World!"
    }
})