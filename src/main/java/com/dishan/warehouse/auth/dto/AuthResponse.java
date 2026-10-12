
package com.dishan.warehouse.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class AuthResponse {

    private String accessToken;

    private String tokenType;

    private List<String> roles;

}
