$(document).ready(function () {
    // Константы и переменные
    const width = 40;
    const height = 24;
    const field = $('.field');
    const map = [];
    let heroPosition = {x: 0, y: 0};
    let heroHealth = 100;
    let heroAttackPower = 1;

    // Обработчик кнопки старта игры
    $("#startGame").click(function () {
        $("#intro").hide();
        $("#game-container").show();
        generateNewLevel();
    });

    // Обработчик клавиш для старта игры
    $(document).keydown(function (event) {
        if ((event.keyCode === 32 || event.keyCode === 13) && $("#intro").is(":visible")) { // Пробел (32) или Enter (13)
            $("#intro").hide();
            $("#game-container").show();
            generateNewLevel();
        }
    });

    // Общие константы
    const directions = [
        [0, -1], [0, 1], [-1, 0], [1, 0]
    ];

    const directionObjects = [
        {dx: 0, dy: -1}, // вверх
        {dx: 0, dy: 1},  // вниз
        {dx: -1, dy: 0}, // влево
        {dx: 1, dy: 0}   // вправо
    ];

    // Инициализация карты стенами
    function initializeMap() {
        for (let y = 0; y < height; y++) {
            map[y] = [];
            for (let x = 0; x < width; x++) {
                map[y][x] = 'wall';
            }
        }
    }

    // Генерация уровня
    function generateNewLevel() {
        field.empty();
        initializeMap();
        createRooms();
        createCorridors();
        placeExit();
        placeCharacter('hero');
        placeItems('sword', 2);
        placeItems('potion', 10);
        placeEnemies(10);
        visited.clear(); // Очищаем список посещенных клеток при переходе на новый уровень
        drawMap();
    }

    // Соединение комнат коридорами (MST алгоритм)
    function connectRooms(rooms) {
        let edges = [];

        // Создаём все возможные рёбра между комнатами
        for (let i = 0; i < rooms.length; i++) {
            for (let j = i + 1; j < rooms.length; j++) {
                let distance = Math.abs(rooms[i].x - rooms[j].x) + Math.abs(rooms[i].y - rooms[j].y);
                edges.push({from: i, to: j, distance});
            }
        }

        // Сортируем рёбра по весу (алгоритм Прима/Краскала)
        edges.sort((a, b) => a.distance - b.distance);

        let connected = new Set([0]); // Набор соединённых комнат
        let mst = [];

        while (connected.size < rooms.length) {
            for (let edge of edges) {
                if (connected.has(edge.from) && !connected.has(edge.to)) {
                    mst.push(edge);
                    connected.add(edge.to);
                    break;
                } else if (connected.has(edge.to) && !connected.has(edge.from)) {
                    mst.push(edge);
                    connected.add(edge.from);
                    break;
                }
            }
        }

        // Создаём коридоры по MST
        for (let edge of mst) {
            let from = rooms[edge.from];
            let to = rooms[edge.to];

            let x = from.x, y = from.y;

            while (x !== to.x) {
                map[y][x] = 'corridor';
                x += (to.x > x) ? 1 : -1;
            }

            while (y !== to.y) {
                map[y][x] = 'corridor';
                y += (to.y > y) ? 1 : -1;
            }
        }
    }

    // Создание комнат
    function createRooms() {
        const roomCount = Math.floor(Math.random() * 6) + 5;
        let rooms = [];

        for (let i = 0; i < roomCount; i++) {
            let roomWidth = Math.floor(Math.random() * 4) + 3;
            let roomHeight = Math.floor(Math.random() * 4) + 3;
            let startX = Math.floor(Math.random() * (width - roomWidth - 2)) + 1;
            let startY = Math.floor(Math.random() * (height - roomHeight - 2)) + 1;

            // Сохраняем координаты центра комнаты
            let centerX = startX + Math.floor(roomWidth / 2);
            let centerY = startY + Math.floor(roomHeight / 2);
            rooms.push({x: centerX, y: centerY});

            // Создаём саму комнату
            for (let y = startY; y < startY + roomHeight; y++) {
                for (let x = startX; x < startX + roomWidth; x++) {
                    map[y][x] = 'floor';
                }
            }
        }

        connectRooms(rooms); // Соединяем комнаты коридорами
    }

    // Создание коридоров
    function createCorridors() {
        const corridorCount = Math.floor(Math.random() * 3) + 3;
        for (let i = 0; i < corridorCount; i++) {
            let startX = Math.floor(Math.random() * (width - 2)) + 1;
            for (let y = 1; y < height - 1; y++) {
                if (map[y][startX] !== 'floor') {
                    map[y][startX] = 'corridor';
                }
            }
        }
        for (let i = 0; i < corridorCount; i++) {
            let startY = Math.floor(Math.random() * (height - 2)) + 1;
            for (let x = 1; x < width - 1; x++) {
                if (map[startY][x] !== 'floor') {
                    map[startY][x] = 'corridor';
                }
            }
        }
    }

    // Размещение объектов на карте
    function placeRandomly(type, tileType = 'floor') {
        while (true) {
            let x = Math.floor(Math.random() * width);
            let y = Math.floor(Math.random() * height);
            if (map[y][x] === tileType) {
                map[y][x] = type;
                if (type === 'hero') heroPosition = {x, y};
                return {x, y};
            }
        }
    }

    function placeExit() {
        placeRandomly('exit', 'corridor');
    }

    function placeCharacter(character) {
        placeRandomly(character);
    }

    function placeItems(item, count = 1) {
        for (let i = 0; i < count; i++) {
            placeCharacter(item);
        }
    }

    function placeEnemies(count) {
        for (let i = 0; i < count; i++) {
            placeCharacter('enemy');
        }
    }

    // Обновление полосы здоровья
    function updateHealthBar() {
        $(".hero .health").css("width", (heroHealth / 100) * 100 + "%");
    }

    let visited = new Set(); // Храним координаты видимых/посещенных клеток

    // Движение героя
    function moveHero(dx, dy) {
        let newX = heroPosition.x + dx;
        let newY = heroPosition.y + dy;

        // Проверяем, чтобы не выйти за границы карты и чтобы тайл был проходимым
        if (map[newY] && map[newY][newX] &&
            (map[newY][newX] === 'floor' ||
                map[newY][newX] === 'corridor' ||
                map[newY][newX] === 'potion' ||
                map[newY][newX] === 'sword' ||
                map[newY][newX] === 'exit')) {

            if (map[newY][newX] === 'potion') {
                heroHealth = Math.min(heroHealth + 20, 100); // Здоровье максимум 100
            }
            if (map[newY][newX] === 'sword') {
                heroAttackPower += 1; // Увеличиваем силу атаки
            }
            if (map[newY][newX] === 'exit') {
                if (confirm("Вы перешли на следующий уровень! Начать новый уровень?")) {
                    return generateNewLevel();
                }
            }
            // Обновляем карту: прошлое место героя становится полом
            map[heroPosition.y][heroPosition.x] = 'floor';
            heroPosition.x = newX;
            heroPosition.y = newY;
            map[newY][newX] = 'hero';
            drawMap();
        }
    }

    // Отображение текста промаха
    function showMissText(x, y) {
        const tileSize = 25; // размер тайла
        const offsetX = $(".field").offset().left; // положение игрового поля
        const offsetY = $(".field").offset().top;

        const missText = $('<div class="miss-text">Miss!</div>');
        missText.css({
            left: (x * tileSize) + offsetX + 'px',
            top: (y * tileSize) + offsetY + 'px',
            position: 'absolute',
            zIndex: 1000
        });

        $('body').append(missText); // Добавляем в body, чтобы не зависеть от flex-контейнера

        setTimeout(() => {
            missText.remove();
        }, 1000);
    }

    // Атака героя по врагам
    function attackEnemies() {
        let directions = [
            [0, -1], [0, 1], [-1, 0], [1, 0]
        ];

        // Анимируем героя при атаке
        let heroTile = $('.tile').eq(heroPosition.y * width + heroPosition.x);
        heroTile.addClass('attack');
        setTimeout(() => {
            heroTile.removeClass('attack'); // Убираем анимацию после окончания
        }, 200);

        // Выполняем атаку врагов
        directions.forEach(([dx, dy]) => {
            let x = heroPosition.x + dx;
            let y = heroPosition.y + dy;
            if (map[y] && map[y][x] === 'enemy') {
                if (Math.random() < heroAttackPower / 2) {
                    map[y][x] = 'floor'; // Убиваем врага
                } else {
                    // Промах - показываем "Miss"
                    showMissText(x, y);
                }
            }
        });
        drawMap();
    }

    // Атака врагов по герою
    function enemyAttack() {
        let directions = [
            [0, -1], [0, 1], [-1, 0], [1, 0]
        ];

        // Ищем всех врагов, рядом с которыми находится герой
        directions.forEach(([dx, dy]) => {
            let x = heroPosition.x + dx;
            let y = heroPosition.y + dy;

            // Если на позиции враг
            if (map[y] && map[y][x] === 'enemy') {
                // Наносим урон игроку
                heroHealth -= 10;
                updateHealthBar();

                // Проверка на смерть игрока
                if (heroHealth <= 0) {
                    alert("Вы погибли! Игра окончена.");
                    location.reload();
                }
            }
        });
    }

    // Движение врагов
    function moveEnemies() {
        let enemyPositions = [];

        // Сканируем карту и находим всех врагов
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (map[y][x] === 'enemy') {
                    enemyPositions.push({x, y});
                }
            }
        }

        enemyPositions.forEach(({x, y}) => {
            let distanceToHero = Math.abs(heroPosition.x - x) + Math.abs(heroPosition.y - y);
            let newX = x;
            let newY = y;

            // Двигаемся к герою, если он в пределах 6 клеток
            if (distanceToHero <= 6) {
                if (heroPosition.x > x) newX++;
                else if (heroPosition.x < x) newX--;

                if (heroPosition.y > y) newY++;
                else if (heroPosition.y < y) newY--;
            } else {
                // Случайное движение, если герой далеко
                let directions = [
                    {dx: 0, dy: -1}, // вверх
                    {dx: 0, dy: 1},  // вниз
                    {dx: -1, dy: 0}, // влево
                    {dx: 1, dy: 0}   // вправо
                ];
                let randomDir = directions[Math.floor(Math.random() * directions.length)];
                newX = x + randomDir.dx;
                newY = y + randomDir.dy;
            }

            // Проверяем, можно ли переместиться в новое место
            if (map[newY] && map[newY][newX] === 'floor') {
                // Перемещаем врага
                map[y][x] = 'floor';
                map[newY][newX] = 'enemy';
            } else {
                // Если не можем переместиться, пытаемся найти альтернативу (например, если враг не может двигаться в сторону героя)
                let alternateDirections = [
                    {dx: 0, dy: -1}, // вверх
                    {dx: 0, dy: 1},  // вниз
                    {dx: -1, dy: 0}, // влево
                    {dx: 1, dy: 0}   // вправо
                ];

                // Пробуем переместить врага в другую клетку, если выбранное направление заблокировано
                let moved = false;
                for (let dir of alternateDirections) {
                    newX = x + dir.dx;
                    newY = y + dir.dy;
                    if (map[newY] && map[newY][newX] === 'floor') {
                        map[y][x] = 'floor';
                        map[newY][newX] = 'enemy';
                        moved = true;
                        break;
                    }
                }

                // Если не смогли найти альтернативное движение, враг остаётся на месте
                if (!moved) {
                    // Оставляем врага в том же месте, ничего не меняем
                    map[y][x] = 'enemy';
                }
            }
        });

        enemyAttack(); // Враги атакуют, если рядом с героем
        drawMap(); // Перерисовываем карту
    }

    generateNewLevel();
    console.log(map);

    function drawMap() {
        field.empty();
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let tile = $('<div class="tile"></div>');
                tile.addClass(map[y][x]);

                let distance = Math.sqrt((heroPosition.x - x) ** 2 + (heroPosition.y - y) ** 2);

                if (distance <= 6) {
                    tile.css("filter", "brightness(1)");
                    visited.add(`${x},${y}`); // Добавляем текущую видимую клетку в посещенные
                } else if (visited.has(`${x},${y}`)) {
                    tile.css("filter", "brightness(0.3)");
                } else {
                    tile.css("filter", "brightness(0)");
                }

                // Добавляем полосу здоровья только для героя и врагов
                if (map[y][x] === 'hero' || map[y][x] === 'enemy') {
                    let healthBar = $('<div class="health"></div>');

                    let healthPercent = (map[y][x] === 'hero')
                        ? (heroHealth / 100) * 100
                        : 100; // У врагов пока 100% здоровья

                    healthBar.css({
                        "width": healthPercent + "%",
                        "background-color": map[y][x] === "hero" ? "green" : "red"
                    });

                    tile.append(healthBar);
                }

                field.append(tile);
            }
        }

        // Обновляем полосу здоровья героя
        updateHealthBar();
    }


    const pressedKeys = {};

    $(document).keydown(function (event) {
        // Если клавиша уже зажата, игнорируем повторные нажатия
        if (pressedKeys[event.keyCode]) return;

        pressedKeys[event.keyCode] = true;

        const keyCodeMap = {
            87: [0, -1], 38: [0, -1],  // W, UpArrow
            83: [0, 1], 40: [0, 1],    // S, DownArrow
            65: [-1, 0], 37: [-1, 0],  // A, LeftArrow
            68: [1, 0], 39: [1, 0],    // D, RightArrow
            32: 'space'                // Space
        };

        if (keyCodeMap[event.keyCode]) {
            if (keyCodeMap[event.keyCode] === 'space') {
                attackEnemies();
                enemyAttack();
            } else {
                moveHero(...keyCodeMap[event.keyCode]);
                moveEnemies();
                enemyAttack();
            }
        }
    });

    $(document).keyup(function (event) {
        // Удаляем клавишу из списка зажатых при отпускании
        delete pressedKeys[event.keyCode];
    });

    drawMap();
});