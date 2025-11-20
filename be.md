# Kotlin Spring Backend — Kotest + Integration Tests in ./src/integration + Testcontainers

Projekt po zmianach: **bez oddzielnego modułu**, wszystko w jednym Gradle module:

```
backend/
├── build.gradle.kts
└── src/
    ├── main/kotlin/...        ← kod produkcyjny
    ├── test/kotlin/...        ← testy jednostkowe (Kotest)
    └── integration/kotlin/... ← testy integracyjne (Kotest + Testcontainers)
```

---

# 📌 build.gradle.kts

```kotlin
plugins {
    id("org.springframework.boot") version "3.2.0"
    id("io.spring.dependency-management") version "1.1.3"
    kotlin("jvm") version "1.9.0"
    kotlin("plugin.spring") version "1.9.0"
}

group = "com.example"
version = "0.0.1-SNAPSHOT"

java {
    sourceCompatibility = JavaVersion.VERSION_17
}

kotlin {
    jvmToolchain(17)
}

sourceSets {
    create("integration") {
        kotlin.srcDir("src/integration/kotlin")
        resources.srcDir("src/integration/resources")
        compileClasspath += sourceSets.main.get().output + configurations.testRuntimeClasspath
        runtimeClasspath += output + compileClasspath
    }
}

tasks.register<Test>("integrationTest") {
    description = "Runs integration tests."
    group = "verification"
    testClassesDirs = sourceSets["integration"].output.classesDirs
    classpath = sourceSets["integration"].runtimeClasspath
    useJUnitPlatform()
    dependsOn(tasks.named("assemble"))
}

tasks.check { dependsOn(tasks.named("integrationTest")) }

repositories { mavenCentral() }

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jdbc")
    implementation("org.flywaydb:flyway-core")
    implementation("org.postgresql:postgresql")

    // Kotest
    testImplementation("io.kotest:kotest-runner-junit5:5.8.0")
    testImplementation("io.kotest:kotest-assertions-core:5.8.0")
    testImplementation("io.kotest:kotest-framework-engine:5.8.0")

    // Spring test
    testImplementation("org.springframework.boot:spring-boot-starter-test")

    // Testcontainers
    "integrationImplementation"("io.kotest:kotest-runner-junit5:5.8.0")
    "integrationImplementation"("io.kotest:kotest-assertions-core:5.8.0")
    "integrationImplementation"("org.springframework.boot:spring-boot-starter-test")
    "integrationImplementation"("org.testcontainers:junit-jupiter:1.19.7")
    "integrationImplementation"("org.testcontainers:postgresql:1.19.7")
}
```

---

# 📌 Przykładowy controller

```kotlin
package com.example.demo.api

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@RestController
class HelloController {
    @GetMapping("/hello")
    fun hello() = mapOf("msg" to "Hello World")
}
```

---

# 📌 Test jednostkowy — Kotest

`src/test/kotlin/.../HelloControllerTest.kt`

```kotlin
package com.example.demo.api

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
```

---

# 📌 Test integracyjny — Testcontainers

`src/integration/kotlin/.../HelloIntegrationTest.kt`

```kotlin
package com.example.demo

import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.beans.factory.annotation.Autowired
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class HelloIntegrationTest(@Autowired val restTemplate: TestRestTemplate): StringSpec({

    "GET /hello works with real app context" {
        val response = restTemplate.getForEntity("/hello", String::class.java)
        response.statusCode.value() shouldBe 200
        response.body!!.contains("Hello World") shouldBe true
    }
}) {
    companion object {
        @Container
        val postgres = PostgreSQLContainer<Nothing>("postgres:15").apply {
            withDatabaseName("testdb")
            withUsername("test")
            withPassword("test")
        }
    }
}
```

---

# 📌 Schemat bazy — Flyway

`src/main/resources/db/migration/V1__initial.sql`

```sql
CREATE TABLE sample_item (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

Projekt jest gotowy. Jeśli chcesz — mogę dopisać Dockerfile, compose, albo workflow pod CI/CD.
