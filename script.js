// define uma função  chamada 'replay'. Quando ela é chamada, ela recarrega a página atual usando 'window.location.reload()'
    const replay = () => {
        window.location.reload();
    }

// variáveis para a configuração da página
var config = {
    // Define o tipo de renderização
    type: Phaser.AUTO,

    // Define a largura da tela do jogo 
    width: 800,

    // Define a altura da tela do jogo
    height: 600,

    // Define configurações físicas do jogo
    physics: {

        // Define o motor de física padrão como Arcade Physics
        default: 'arcade',
        
        // Configrações específicas para a física do arcade
        arcade: {

            // Define a gravidade vertical aplicada a objetos
            gravity: { y: 300 },

            // Define as informações de debug da física devem ser exibidas, neste caso está desativado
            debug: false
        }
    },
       scene: {
    preload: preload,   // Define a função de pré-carregamento de recursos
    create: create,     // Define a função de criação dos elementos do jogo
    update: update      // Define a função de atualização do jogo a cada quadro
    }
};

var player;            // Declaração da variável player para representar o personagem jogador
var stars;             // Declaração da variável stars para representar as estrelas a serem coletadas
var bombs;             // Declaração da variável bombs para representar as bombas
var platforms;         // Declaração da variável platforms para representar as plataformas do jogo
var cursors;           // Declaração da variável cursors para representar os controles do teclado
var score = 0;         // Inicialização da variável score com o valor 0 para representar a pontuação do jogador
var gameOver = false;  // Inicialização da variável gameOver com o valor false para indicar se o jogo acabou
var scoreText;         // Declaração da variável scoreText para representar o texto da pontuação

var game = new Phaser.Game(config);  // Criação do jogo com a configuração definida anteriormente


function preload () {
    // Função de pré-carregamento de recursos
    this.load.image('sky', 'assets/sky.png');              // Carrega a imagem do céu
    this.load.image('ground', 'assets/platform.png');      // Carrega a imagem da plataforma
    this.load.image('star', 'assets/star.png');            // Carrega a imagem da estrela
    this.load.image('bomb', 'assets/bomb.png');            // Carrega a imagem da bomba
    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });  // Carrega a sprite do jogador
}

function create () {
    // Função de criação dos elementos do jogo
    this.add.image(400, 300, 'sky');  // Adiciona a imagem do céu
    platforms = this.physics.add.staticGroup();  // Cria um grupo de plataformas estáticas

    // Cria as plataformas do jogo
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    // Adiciona o jogador ao jogo
    player = this.physics.add.sprite(100, 450, 'dude');
    player.setBounce(0.2);  // Define o quão alto o jogador deve pular ao colidir com o chão
    player.setCollideWorldBounds(true);  // Define que o jogador não pode sair dos limites do mundo

    // Cria as animações do jogador
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'turn',
        frames: [ { key: 'dude', frame: 4 } ],
        frameRate: 20
    });
    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    // Adiciona eventos de teclado
    cursors = this.input.keyboard.createCursorKeys();

    // Adiciona as estrelas ao jogo
    stars = this.physics.add.group({
        key: 'star',
        repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 }
    });

    // Adiciona comportamento às estrelas
    stars.children.iterate(function (child) {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    // Adiciona as bombas ao jogo
    bombs = this.physics.add.group();

    // Adiciona o texto da pontuação ao jogo
    scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });

    // Adiciona colisões entre os elementos do jogo
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(stars, platforms);
    this.physics.add.collider(bombs, platforms);
    this.physics.add.overlap(player, stars, collectStar, null, this);
    this.physics.add.collider(player, bombs, hitBomb, null, this);
}

function update () {
    // Função de atualização do jogo a cada quadro

    if (gameOver) {
        // Se o jogo acabou, exibe a pontuação final e encerra o jogo
        setTimeout(() => {
            let scoreDiv = document.getElementById('gameover-max-div');
            let scoreSpan = document.getElementById('score');
            scoreSpan.textContent = score;
            scoreDiv.style.display = 'block';
        }, 1500);
        return;
    }

    // Movimentação do jogador com base nos controles do teclado
    if (cursors.left.isDown) {
        player.setVelocityX(-160);
        player.anims.play('left', true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);
        player.anims.play('right', true);
    } else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    // Pulo do jogador
    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-330);
    }
}


function collectStar (player, star) {
    // Função chamada quando o jogador coleta uma estrela

    star.disableBody(true, true);  // Remove a estrela do jogo
    score += 10;                   // Incrementa a pontuação
    scoreText.setText('Score: ' + score);  // Atualiza o texto da pontuação

    // Se todas as estrelas foram coletadas, cria uma nova leva de estrelas e adiciona uma bomba ao jogo
    if (stars.countActive(true) === 0) {
        stars.children.iterate(function (child) {
            child.enableBody(true, child.x, 0, true, true);
        });
        var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
        var bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        bomb.allowGravity = false;
    }
}

ffunction hitBomb (player, bomb, score) {
    // Função chamada quando o jogador colide com uma bomba

    this.physics.pause();           // Pausa a física do jogo
    player.setTint(0xff0000);      // Tinge o jogador de vermelho
    player.anims.play('turn');     // Executa a animação de "turn"
    gameOver = true;                // Define que o jogo acabou
    
}
