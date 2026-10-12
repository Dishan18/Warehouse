package com.dishan.warehouse.product;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.dishan.warehouse.auth.entity.Role;
import com.dishan.warehouse.auth.entity.User;
import com.dishan.warehouse.auth.repository.RoleRepository;
import com.dishan.warehouse.auth.repository.UserRepository;
import com.dishan.warehouse.config.TestcontainersConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@org.junit.jupiter.api.Disabled("Requires Docker daemon for Testcontainers")
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfig.class)
class ProductApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final AtomicInteger COUNTER = new AtomicInteger();

    private static final String PASSWORD = "Passw0rd!";

    private String unique(String prefix) {
        return prefix + COUNTER.incrementAndGet();
    }

    private String registerEmployee() throws Exception {
        String email = unique("emp") + "@warehouse.com";
        String body = """
                {
                  "firstName": "Emp",
                  "lastName": "User",
                  "email": "%s",
                  "password": "%s"
                }
                """.formatted(email, PASSWORD);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());
        return loginToken(email);
    }

    private String createAdminAndLogin() throws Exception {
        String email = unique("admin") + "@warehouse.com";
        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseThrow(() -> new IllegalStateException("ADMIN role not seeded"));

        User admin = User.builder()
                .firstName("Admin")
                .lastName("User")
                .email(email)
                .password(passwordEncoder.encode(PASSWORD))
                .roles(Set.of(adminRole))
                .build();
        userRepository.save(admin);

        return loginToken(email);
    }

    private String loginToken(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s", "password": "%s"}
                                """.formatted(email, PASSWORD)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        return body.get("accessToken").asText();
    }

    private String createCategory(String token) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "%s", "description": "integration test category"}
                                """.formatted(unique("Cat"))))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("id").asText();
    }

    private String createProduct(String token, String categoryId) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/products")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "%s",
                                  "sku": "%s",
                                  "price": 12.5,
                                  "quantity": 50,
                                  "minStock": 5,
                                  "categoryId": "%s"
                                }
                                """.formatted(unique("Product"), unique("SKU-"), categoryId)))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("id").asText();
    }

    @Test
    void createCategoryAndProduct_thenList() throws Exception {
        String token = registerEmployee();
        String categoryId = createCategory(token);
        String productId = createProduct(token, categoryId);

        mockMvc.perform(get("/api/products/{id}", productId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").isNotEmpty())
                .andExpect(jsonPath("$.status").value("IN_STOCK"));

        mockMvc.perform(get("/api/products")
                        .header("Authorization", "Bearer " + token)
                        .param("search", "Product"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").isNumber());
    }

    @Test
    void createInboundMovement_updatesStock() throws Exception {
        String token = registerEmployee();
        String categoryId = createCategory(token);
        String productId = createProduct(token, categoryId);

        mockMvc.perform(post("/api/movements/inbound")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"productId": "%s", "quantity": 10, "reason": "integration restock"}
                                """.formatted(productId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("INBOUND"));
    }

    @Test
    void outboundMovement_overAvailableStock_returnsBadRequest() throws Exception {
        String token = registerEmployee();
        String categoryId = createCategory(token);
        String productId = createProduct(token, categoryId);

        mockMvc.perform(post("/api/movements/outbound")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"productId": "%s", "quantity": 9999, "reason": "impossible outbound"}
                                """.formatted(productId)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void employee_cannotAccessAdminUsersEndpoint() throws Exception {
        String token = registerEmployee();

        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void admin_canAccessUsersEndpoint() throws Exception {
        String token = createAdminAndLogin();

        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void dashboardSummary_returnsStats() throws Exception {
        String token = registerEmployee();

        mockMvc.perform(get("/api/dashboard/summary")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalProducts").isNumber());
    }

    @Test
    void unknownProduct_returnsNotFound() throws Exception {
        String token = registerEmployee();

        mockMvc.perform(get("/api/products/{id}", "00000000-0000-0000-0000-000000000000")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void createProduct_withoutToken_returnsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "x", "sku": "y", "price": 1, "quantity": 1,
                                 "minStock": 1, "categoryId": "00000000-0000-0000-0000-000000000000"}
                                """))
                .andExpect(status().isUnauthorized());
    }
}
