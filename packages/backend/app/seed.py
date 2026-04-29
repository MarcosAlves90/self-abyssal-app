from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Branch, BranchReservationDepth, MenuItem, User, UserRole
from .security import HashingService, TextCrypto, hash_password

IMAGE_BASE_URL = "https://res.cloudinary.com/dflvo098t/image/upload"
DESCRIPTION = (
    "Composicao autoral com ingredientes do mar, finalizacao delicada e contraste luminoso inspirado na "
    "experiencia abissal."
)


def seed_database(session: Session, *, enabled: bool, admin_name: str, admin_email: str, admin_password: str, crypto: TextCrypto, hashing: HashingService) -> None:
    if not enabled:
        return

    seed_admin(session, admin_name=admin_name, admin_email=admin_email, admin_password=admin_password, crypto=crypto, hashing=hashing)
    seed_catalog(session)
    session.commit()


def seed_admin(session: Session, *, admin_name: str, admin_email: str, admin_password: str, crypto: TextCrypto, hashing: HashingService) -> None:
    normalized_email = admin_email.strip().lower()
    email_hash = hashing.sha256(normalized_email)

    if session.scalar(select(User).where(User.email_hash == email_hash)) is not None:
        return

    admin = User(
        name=admin_name.strip(),
        email_hash=email_hash,
        email_encrypted=crypto.encrypt(normalized_email),
        password_hash=hash_password(admin_password),
        role=UserRole.ADMIN.value,
    )
    session.add(admin)


def seed_catalog(session: Session) -> None:
    if session.scalar(select(Branch).limit(1)) is None:
        session.add_all(sample_branches())

    if session.scalar(select(MenuItem).limit(1)) is None:
        session.add_all(sample_menu_items())


def sample_branches() -> list[Branch]:
    return [
        branch("Abyssal Paulista", "abyssal-paulista", "Sao Paulo", "Bela Vista", "Av. Paulista, 1100", "18:00 - 23:30", ["Zona Crepuscular", "Zona Mesopelagica", "Zona Abissal"]),
        branch("Abyssal Pinheiros", "abyssal-pinheiros", "Sao Paulo", "Pinheiros", "Rua dos Corais, 245", "18:30 - 23:00", ["Superficie", "Zona Crepuscular", "Zona Abissal"]),
        branch("Abyssal Santos", "abyssal-santos", "Santos", "Ponta da Praia", "Av. do Oceano, 89", "19:00 - 00:00", ["Zona Mesopelagica", "Zona Batipelagica", "Zona Abissal"]),
    ]


def branch(name: str, slug: str, city: str, neighborhood: str, address_line: str, open_hours: str, reservation_depths: list[str]) -> Branch:
    item = Branch(name=name, slug=slug, city=city, neighborhood=neighborhood, address_line=address_line, open_hours=open_hours)
    item.reservation_depths = [BranchReservationDepth(depth_level=depth) for depth in sorted(reservation_depths)]
    return item


def sample_menu_items() -> list[MenuItem]:
    return [
        menu_item("Ostra Neon", "ostra-neon", "entradas", 21000, True, "ostra", True, True, "#31e7ff", image_url("v1777411035/ostra-neon_ve7zy8.png")),
        menu_item("Ceviche de Lulas Prismatica", "ceviche-lulas-prismatica", "entradas", 24000, True, "lulas", False, True, "#8df9ff", image_url("v1777411032/ceviche-de-lula-prismatica_so2mz7.png")),
        menu_item("Bao de Camarao Fantasma", "bao-camarao-fantasma", "entradas", 18000, False, "bao", True, True, "#1ad1c9", image_url("v1777411031/bao-de-camarao-fantasma_qyyica.png")),
        menu_item("Tartare de Atum Obscuro", "tartare-atum-obscuro", "entradas", 25500, False, "atum", False, True, "#7ae1ff", image_url("v1777411040/tartare-de-atum-obscuro_sywz7l.png")),
        menu_item("Lagosta Bioluminescente", "lagosta-bioluminescente", "principais", 64500, True, "lagosta", True, True, "#31e7ff", image_url("v1777411034/lagosta-bioluminescente_jm3yho.png")),
        menu_item("Risoto de Polvo Ink", "risoto-polvo-ink", "principais", 38000, True, "polvo", True, True, "#8df9ff", image_url("v1777411038/risoto-de-polvo-ink_ssaybc.png")),
        menu_item("Bacalhau das Correntes Frias", "bacalhau-correntes-frias", "principais", 42000, False, "bacalhau", True, True, "#1ad1c9", image_url("v1777411030/bacalhau-das-correntes-frias_zgrpjx.png")),
        menu_item("Arroz Negro com Vieiras", "arroz-negro-vieiras", "principais", 46500, False, "vieiras", True, True, "#7ae1ff", image_url("v1777411030/arroz-negro-com-vieiras_wrintx.png")),
        menu_item("Ramen de Mariscos Abissal", "ramen-mariscos-abissal", "principais", 33500, False, "ramen", True, True, "#31e7ff", image_url("v1777411037/ramen-de-mariscos-abissal_uogw0u.png")),
        menu_item("Brioche de Caranguejo Azul", "brioche-caranguejo-azul", "principais", 29500, False, "caranguejo", True, True, "#8df9ff", image_url("v1777411032/brioche-de-carangueijo-azul_nxzyqy.png")),
        menu_item("Mousse de Algas Doces", "mousse-algas-doces", "sobremesas", 14500, False, "mousse", True, True, "#1ad1c9", image_url("v1777411035/mousse-de-algas-doces_nxscnq.png")),
        menu_item("Torta Lua de Perola", "torta-lua-de-perola", "sobremesas", 17000, True, "torta", True, True, "#7ae1ff", image_url("v1777411042/torta-de-lula-de-perola_voaw6i.png")),
        menu_item("Pudim de Sal Marinho", "pudim-sal-marinho", "sobremesas", 13500, False, "pudim", True, True, "#31e7ff", image_url("v1777411038/pudim-de-sal-marinho_c5zt9v.png")),
        menu_item("Elixir de Plancton", "elixir-de-plancton", "bebidas", 11000, True, "drink", True, True, "#8df9ff", image_url("v1777411033/elixir-de-plancton_wou2tn.png")),
        menu_item("Soda de Agua-Viva", "soda-de-agua-viva", "bebidas", 9000, False, "soda", True, True, "#1ad1c9", image_url("v1777411039/soda-de-agua-viva_humpsf.png")),
    ]


def menu_item(name: str, slug: str, category: str, price_cents: int, featured: bool, image_hint: str, available_for_delivery: bool, available_for_dine_in: bool, accent_color: str, image_url: str) -> MenuItem:
    return MenuItem(
        name=name,
        slug=slug,
        description=DESCRIPTION,
        category=category,
        price_cents=price_cents,
        is_featured=featured,
        image_hint=image_hint,
        image_url=image_url,
        available_for_delivery=available_for_delivery,
        available_for_dine_in=available_for_dine_in,
        accent_color=accent_color,
    )


def image_url(path: str) -> str:
    return f"{IMAGE_BASE_URL}/{path}"
