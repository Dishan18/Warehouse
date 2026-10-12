package com.dishan.warehouse.notification.mapper;

import com.dishan.warehouse.entity.Notification;
import com.dishan.warehouse.notification.dto.NotificationResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface NotificationMapper {

    @Mapping(target = "senderId", source = "sender.id")
    @Mapping(target = "senderName", source = "sender.email")
    @Mapping(target = "recipientId", source = "recipient.id")
    @Mapping(target = "read", source = "isRead")
    NotificationResponse toResponse(Notification notification);

}
