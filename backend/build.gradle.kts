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
        compileClasspath += sourceSets["main"].output + configurations["testRuntimeClasspath"]
        runtimeClasspath += output + compileClasspath + sourceSets["main"].runtimeClasspath
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

// Uncomment to run integration tests as part of the build
// tasks.check { dependsOn(tasks.named("integrationTest")) }

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

    // Integration tests
    "integrationImplementation"(kotlin("test"))
    "integrationImplementation"("org.springframework.boot:spring-boot-starter-test")
    "integrationImplementation"("org.testcontainers:junit-jupiter:1.19.7")
    "integrationImplementation"("org.testcontainers:postgresql:1.19.7")
    "integrationImplementation"("io.kotest:kotest-runner-junit5:5.8.0")
    "integrationImplementation"("io.kotest:kotest-assertions-core:5.8.0")
    "integrationImplementation"("io.kotest:kotest-framework-engine:5.8.0")
    "integrationImplementation"("io.kotest.extensions:kotest-extensions-spring:1.1.3")
}