package com.abyssal.shared.security;

import java.util.UUID;

public record AuthenticatedUser(UUID id, String role) {
}
