# -*- coding: utf-8 -*-
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Branch, BranchReservationDepth, MenuItem, User, UserRole
from .core.security import HashingService, TextCrypto, hash_password

IMAGE_BASE_URL = "https://res.cloudinary.com/dflvo098t/image/upload"

DEPTH_SUPERFICIE = "Superfície"
DEPTH_ZONA_CREPUSCULAR = "Zona Crepuscular"
DEPTH_ZONA_MESOPELAGICA = "Zona Mesopelágica"
DEPTH_ZONA_BATIPELAGICA = "Zona Batipelágica"
DEPTH_ZONA_ABISSAL = "Zona Abissal"


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
        branch("Abyssal Paulista", "abyssal-paulista", "São Paulo", "Bela Vista", "Av. Paulista, 1100", "18:00 – 23:30", [DEPTH_ZONA_CREPUSCULAR, DEPTH_ZONA_MESOPELAGICA, DEPTH_ZONA_ABISSAL]),
        branch("Abyssal Pinheiros", "abyssal-pinheiros", "São Paulo", "Pinheiros", "Rua dos Corais, 245", "18:30 – 23:00", [DEPTH_SUPERFICIE, DEPTH_ZONA_CREPUSCULAR, DEPTH_ZONA_ABISSAL]),
        branch("Abyssal Santos", "abyssal-santos", "Santos", "Ponta da Praia", "Av. do Oceano, 89", "19:00 – 00:00", [DEPTH_ZONA_MESOPELAGICA, DEPTH_ZONA_BATIPELAGICA, DEPTH_ZONA_ABISSAL]),
    ]


def branch(name: str, slug: str, city: str, neighborhood: str, address_line: str, open_hours: str, reservation_depths: list[str]) -> Branch:
    item = Branch(name=name, slug=slug, city=city, neighborhood=neighborhood, address_line=address_line, open_hours=open_hours)
    item.reservation_depths = [BranchReservationDepth(depth_level=depth) for depth in sorted(reservation_depths)]
    return item


def sample_menu_items() -> list[MenuItem]:
    return [
        menu_item(
            "Ostra Neon", "ostra-neon", "entradas", 21000, True, "ostra", True, True, "#31e7ff",
            image_url("v1777411035/ostra-neon_ve7zy8.png"),
            description="Ostra fresca servida sobre gelo iluminado com espuma de limão-siciliano e caviar de alga marinha. Contraste entre o mar bruto e a leveza do acabamento luminoso.",
            notes="Servida sobre apresentação iluminada em gelo de sal marinho.\nMaridagem ideal com espumantes brancos secos ou saquê junmai.\nSeleção em destaque pela curadoria da casa.",
        ),
        menu_item(
            "Ceviche de Lulas Prismática", "ceviche-lulas-prismatica", "entradas", 24000, True, "lulas", False, True, "#8df9ff",
            image_url("v1777411032/ceviche-de-lula-prismatica_so2mz7.png"),
            description="Lulas frescas em fatias finas com leche de tigre ao maracujá e maizena de coco tostado. Acidez limpa e textura que preserva o frescor integral do fruto do mar.",
            notes="Lulas cortadas com precisão japonesa no preparo do dia.\nLeche de tigre preparado na hora para manter a acidez viva.\nDisponível exclusivamente no salão.",
        ),
        menu_item(
            "Bao de Camarão Fantasma", "bao-camarao-fantasma", "entradas", 18000, False, "bao", True, True, "#1ad1c9",
            image_url("v1777411031/bao-de-camarao-fantasma_qyyica.png"),
            description="Bao artesanal ao vapor com camarão fantasma marinado em dashi e manteiga de missô. O fechamento delicado esconde o recheio até o primeiro toque.",
            notes="Massa fermentada por 12 horas para textura ideal ao vapor.\nCamarão selecionado diariamente junto aos fornecedores.\nDisponível para salão e delivery.",
        ),
        menu_item(
            "Tartare de Atum Obscuro", "tartare-atum-obscuro", "entradas", 25500, False, "atum", False, True, "#7ae1ff",
            image_url("v1777411040/tartare-de-atum-obscuro_sywz7l.png"),
            description="Tartare de atum bluefin com geleia de soja preta, microgreens marinhos e óleo de nori prensado a frio. Servido em temperatura controlada para exaltar a gordura natural.",
            notes="Atum bluefin rastreado e certificado de pesca sustentável.\nServido a 8 °C para preservar a textura e a gordura natural.\nDisponível exclusivamente no salão.",
        ),
        menu_item(
            "Lagosta Bioluminescente", "lagosta-bioluminescente", "principais", 64500, True, "lagosta", True, True, "#31e7ff",
            image_url("v1777411034/lagosta-bioluminescente_jm3yho.png"),
            description="Lagosta inteira ao forno em manteiga de algas com risoto de tinta de lula e espuma de bisque. O prato ícone da casa, projetado para dominar qualquer mesa.",
            notes="Lagosta escolhida pelo cliente antes do preparo, garantindo frescor absoluto.\nCozida em manteiga clarificada a 180 °C por 12 minutos exatos.\nSeleção em destaque e prato ícone da casa.",
        ),
        menu_item(
            "Risoto de Polvo Ink", "risoto-polvo-ink", "principais", 38000, True, "polvo", True, True, "#8df9ff",
            image_url("v1777411038/risoto-de-polvo-ink_ssaybc.png"),
            description="Risoto negro com tinta de lula fresca, polvo assado a baixa temperatura e crocante de alho negro. Textura aveludada que contrasta com a firmeza intensa do polvo.",
            notes="Polvo cozido a 72 °C por 4 horas antes de ser finalizado na grelha.\nTinta de lula fresca, não pasteurizada, para cor e sabor intensos.\nSeleção em destaque pela curadoria da temporada.",
        ),
        menu_item(
            "Bacalhau das Correntes Frias", "bacalhau-correntes-frias", "principais", 42000, False, "bacalhau", False, True, "#1ad1c9",
            image_url("v1777411030/bacalhau-das-correntes-frias_zgrpjx.png"),
            description="Lombo de bacalhau do Porto confitado em azeite de ervas marinhas, purê de raiz-forte e vinagrete de alcaparras. Receita inspirada nas correntes do Atlântico Norte.",
            notes="Bacalhau dessalgado por 72 horas em água gelada antes do preparo.\nConfitado lentamente em azeite extra-virgem de azeitona verde.\nDisponível somente no salão para manter a temperatura ideal.",
        ),
        menu_item(
            "Arroz Negro com Vieiras", "arroz-negro-vieiras", "principais", 46500, False, "vieiras", False, True, "#7ae1ff",
            image_url("v1777411030/arroz-negro-com-vieiras_wrintx.png"),
            description="Arroz negro de tinta de lula com vieiras seladas em frigideira de ferro e creme de couve-flor defumada. Equilíbrio profundo entre o mar e a terra em cada grão.",
            notes="Vieiras frescas seladas em frigideira de ferro em temperatura máxima.\nArroz negro cozido no próprio caldo de cascas de vieira por 40 minutos.\nDisponível somente no salão.",
        ),
        menu_item(
            "Ramen de Mariscos Abissal", "ramen-mariscos-abissal", "principais", 33500, False, "ramen", False, True, "#31e7ff",
            image_url("v1777411037/ramen-de-mariscos-abissal_uogw0u.png"),
            description="Caldo concentrado de casca de caranguejo e bonito com noodles de lula, mariscos frescos e ovo marinado por 48 horas. Profundidade de sabor construída em camadas.",
            notes="Caldo apurado por 18 horas com cascas de crustáceos e kombu.\nNoodles de lula preparados artesanalmente na cozinha da casa.\nDisponível somente no salão.",
        ),
        menu_item(
            "Brioche de Caranguejo Azul", "brioche-caranguejo-azul", "principais", 29500, False, "caranguejo", False, True, "#8df9ff",
            image_url("v1777411032/brioche-de-carangueijo-azul_nxzyqy.png"),
            description="Brioche tostado com caranguejo azul desfiado, maionese de yuzu e chips de taro artesanais. Entrada generosa que transcende a categoria pelo acabamento e profundidade.",
            notes="Brioche assado na hora com manteiga de cultivo próprio da casa.\nCaranguejo azul vivo chegando três vezes por semana dos fornecedores.\nDisponível somente no salão.",
        ),
        menu_item(
            "Mousse de Algas Doces", "mousse-algas-doces", "sobremesas", 14500, False, "mousse", True, True, "#1ad1c9",
            image_url("v1777411035/mousse-de-algas-doces_nxscnq.png"),
            description="Mousse aéreo de algas dulse com caramelo salgado e granita de yuzu batida na hora. Finaliza a experiência com leveza e uma doçura que ecoa o mar de forma sutil.",
            notes="Algas dulse importadas da Islândia e reidratadas 24 h antes do preparo.\nGranita de yuzu batida na hora para textura cristalina e frescor.\nDisponível para salão e delivery.",
        ),
        menu_item(
            "Torta Lua de Pérola", "torta-lua-de-perola", "sobremesas", 17000, True, "torta", True, True, "#7ae1ff",
            image_url("v1777411042/torta-de-lula-de-perola_voaw6i.png"),
            description="Torta de chocolate Valrhona 70% com creme de pérola de tapioca, cobertura de espelho azul e folha de ouro. O grande encerramento visual e sensorial da experiência.",
            notes="Chocolate Valrhona 70% como base da ganache e da cobertura de espelho.\nPérolas de tapioca cozidas por 6 horas em leite de coco integral.\nSeleção em destaque — encerramento ideal da experiência.",
        ),
        menu_item(
            "Pudim de Sal Marinho", "pudim-sal-marinho", "sobremesas", 13500, False, "pudim", True, True, "#31e7ff",
            image_url("v1777411038/pudim-de-sal-marinho_c5zt9v.png"),
            description="Pudim tradicional revisitado com flor de sal marinho artesanal, caramelo de alga kombu e sorvete de baunilha defumada. Doce que carrega a memória do oceano.",
            notes="Flor de sal colhida artesanalmente no litoral paulista por parceiros da casa.\nCaramelo de kombu com 48 horas de redução lenta antes do serviço.\nDisponível para salão e delivery.",
        ),
        menu_item(
            "Elixir de Plâncton", "elixir-de-plancton", "bebidas", 11000, True, "drink", True, True, "#8df9ff",
            image_url("v1777411033/elixir-de-plancton_wou2tn.png"),
            description="Drinque signature com extrato de plâncton certificado, gim botânico, água tônica artesanal e esfera de lichia. Cor e sabor que evocam profundezas luminosas.",
            notes="Extrato de plâncton certificado alimentício de origem marinha controlada.\nGim com infusão de ervas e flores do bioma costeiro brasileiro.\nSeleção em destaque e drinque signature da casa.",
        ),
        menu_item(
            "Soda de Água-Viva", "soda-de-agua-viva", "bebidas", 9000, False, "soda", True, True, "#1ad1c9",
            image_url("v1777411039/soda-de-agua-viva_humpsf.png"),
            description="Água gaseificada com xarope de hibisco, água-viva comestível e zest de limão-siciliano. Refrescante, leve e completamente livre de álcool.",
            notes="Água-viva comestível cultivada em ambiente controlado e certificado.\nXarope de hibisco preparado diariamente para frescor total.\nDisponível para salão e delivery.",
        ),
    ]


def menu_item(
    name: str,
    slug: str,
    category: str,
    price_cents: int,
    featured: bool,
    image_hint: str,
    available_for_delivery: bool,
    available_for_dine_in: bool,
    accent_color: str,
    image_url: str,
    description: str,
    notes: str | None = None,
) -> MenuItem:
    return MenuItem(
        name=name,
        slug=slug,
        description=description,
        category=category,
        price_cents=price_cents,
        is_featured=featured,
        image_hint=image_hint,
        image_url=image_url,
        available_for_delivery=available_for_delivery,
        available_for_dine_in=available_for_dine_in,
        accent_color=accent_color,
        notes=notes,
    )


def image_url(path: str) -> str:
    return f"{IMAGE_BASE_URL}/{path}"
