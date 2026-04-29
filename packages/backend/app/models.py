from datetime import datetime
from enum import StrEnum
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


def uuid_str() -> str:
    return str(uuid4())


class UserRole(StrEnum):
    CUSTOMER = "customer"
    ADMIN = "admin"


class Branch(Base):
    __tablename__ = "branches"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    slug: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    city: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    neighborhood: Mapped[str] = mapped_column(String(80), nullable=False)
    address_line: Mapped[str] = mapped_column(String(120), nullable=False)
    open_hours: Mapped[str] = mapped_column(String(80), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    reservation_depths: Mapped[list["BranchReservationDepth"]] = relationship(
        back_populates="branch", cascade="all, delete-orphan", lazy="selectin"
    )


class BranchReservationDepth(Base):
    __tablename__ = "branch_reservation_depths"

    branch_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("branches.id", ondelete="CASCADE"), primary_key=True
    )
    depth_level: Mapped[str] = mapped_column(String(40), primary_key=True)

    branch: Mapped[Branch] = relationship(back_populates="reservation_depths")


class MenuItem(Base):
    __tablename__ = "menu_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    slug: Mapped[str] = mapped_column(String(60), nullable=False, unique=True)
    description: Mapped[str] = mapped_column(String(300), nullable=False)
    category: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    image_hint: Mapped[str] = mapped_column(String(80), nullable=True)
    image_url: Mapped[str] = mapped_column(String(300), nullable=True)
    available_for_delivery: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    available_for_dine_in: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    accent_color: Mapped[str] = mapped_column(String(20), nullable=False, default="#31e7ff")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    email_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    email_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    phone_encrypted: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    addresses: Mapped[list["UserAddress"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", lazy="selectin"
    )


class UserAddress(Base):
    __tablename__ = "user_addresses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    label: Mapped[str] = mapped_column(String(40), nullable=False)
    postal_code_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    street_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    number_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    complement_encrypted: Mapped[str] = mapped_column(Text, nullable=True)
    neighborhood_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    city_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    state_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    summary_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    user: Mapped[User] = relationship(back_populates="addresses")


class ReservationStatus(StrEnum):
    CONFIRMED = "confirmed"
    CHECKED_IN = "checked_in"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Reservation(Base):
    __tablename__ = "reservations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    branch_id: Mapped[str] = mapped_column(String(36), nullable=False)
    branch_name_snapshot: Mapped[str] = mapped_column(String(80), nullable=False)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    guests: Mapped[int] = mapped_column(Integer, nullable=False)
    depth_level: Mapped[str] = mapped_column(String(40), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    special_request_encrypted: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class FulfillmentType(StrEnum):
    DELIVERY = "delivery"
    DINE_IN = "dine_in"


class OrderStatus(StrEnum):
    PENDING = "pending"
    PREPARING = "preparing"
    ON_THE_WAY = "on_the_way"
    SERVED = "served"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class PaymentMethod(StrEnum):
    IN_APP_CARD_TOKENIZED = "in_app_card_tokenized"
    CARD_ON_DELIVERY = "card_on_delivery"
    ON_SITE = "on_site"


class PaymentStatus(StrEnum):
    PENDING = "pending"
    AUTHORIZED = "authorized"
    PAID = "paid"


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    branch_id: Mapped[str] = mapped_column(String(36), nullable=True)
    branch_name_snapshot: Mapped[str] = mapped_column(String(80), nullable=True)
    reservation_id: Mapped[str] = mapped_column(String(36), nullable=True)
    fulfillment_type: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    payment_method: Mapped[str] = mapped_column(String(30), nullable=False)
    payment_status: Mapped[str] = mapped_column(String(20), nullable=False)
    delivery_address_encrypted: Mapped[str] = mapped_column(Text, nullable=True)
    contact_name_encrypted: Mapped[str] = mapped_column(Text, nullable=True)
    total_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan", lazy="selectin"
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    menu_item_id: Mapped[str] = mapped_column(String(36), nullable=False)
    name_snapshot: Mapped[str] = mapped_column(String(80), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    note_encrypted: Mapped[str] = mapped_column(Text, nullable=True)

    order: Mapped[Order] = relationship(back_populates="items")
