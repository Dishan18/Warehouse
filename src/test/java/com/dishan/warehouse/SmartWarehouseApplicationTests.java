package com.dishan.warehouse;

import com.dishan.warehouse.config.TestcontainersConfig;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

@org.junit.jupiter.api.Disabled("Requires Docker daemon for Testcontainers")
@SpringBootTest
@ActiveProfiles("test")
@Import(TestcontainersConfig.class)
class SmartWarehouseApplicationTests {

	@Test
	void contextLoads() {
	}

}
