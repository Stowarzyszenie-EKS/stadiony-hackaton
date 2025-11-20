package com.example.demo

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@RestController
class HelloController {

    @GetMapping("/hello")
    fun hello(): HelloResponse = HelloResponse("Hello world!")

    data class HelloResponse(val value: String)
}