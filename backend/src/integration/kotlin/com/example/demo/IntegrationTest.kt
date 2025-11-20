package com.example.demo

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.containers.wait.strategy.Wait

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class HelloIntegrationTest {

    companion object {
        @JvmStatic
        val postgres: PostgreSQLContainer<*> = PostgreSQLContainer("postgres:15")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test")
            .waitingFor(Wait.forListeningPort())
            .withReuse(false)

        @JvmStatic
        @BeforeAll
        fun startContainer() {
            postgres.start()
        }

        @JvmStatic
        @DynamicPropertySource
        fun configureProperties(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl)
            registry.add("spring.datasource.username", postgres::getUsername)
            registry.add("spring.datasource.password", postgres::getPassword)
        }
    }

    @Autowired
    private lateinit var restTemplate: TestRestTemplate

    @Test
    fun `GET hello works with real app context`() {
        val response = restTemplate.getForEntity("/hello", String::class.java)
        assertEquals(200, response.statusCode.value())
        assertTrue(response.body!!.contains("Hello World"))
    }
}
