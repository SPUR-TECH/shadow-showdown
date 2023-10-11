window.addEventListener('load', function () {
    const canvas = document.getElementById("canvas1");
    const ctx = canvas.getContext('2d');
    canvas.width = 1600;
    canvas.height = 710;
    let enemies = [];
    let score = 0;
    let gameOver = false;
    let gameSpeed = 2;
    // let explosions = [];
    let canvasPosition = canvas.getBoundingClientRect();

    const fullscreen = document.getElementById("fullscreen");

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            canvas.requestFullscreen().catch(err => {
                alert(`Error cant enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }
    fullscreen.addEventListener('click', toggleFullscreen);

    class Player {
        constructor(gameWidth, gameHeight) {
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 200;
            this.height = 200;
            this.x = 100;
            this.y = this.gameHeight - this.height;
            this.image = document.getElementById('playerImage');
            this.frameX = 0;
            this.frameY = 0;
            this.maxFrame = 8;
            this.fps = 20;
            this.frameTimer = 0;
            this.frameInterval = 1000 / this.fps;
            this.speed = 0;
            this.vy = 0;
            this.gravity = 1;
            this.jumping = false;
        }

        restart() {
            this.x = 100;
            this.y = this.gameHeight - this.height;
            this.frameY = 0;
            this.maxFrame = 8;
            this.jumping = false;
        }

        draw(ctx) {
            ctx.drawImage(this.image, this.frameX * this.width, this.frameY * this.height, this.width, this.height, this.x, this.y, this.width, this.height);
        }

        handleInput(keys) {
            if (keys.has('ArrowRight')) {
                this.speed = 5;
            } else if (keys.has('ArrowLeft')) {
                this.speed = -5;
            } else {
                this.speed = 0;
            }
        }

        update(input, deltaTime) {
            if (gameOver) return; // Stop player updates when the game is over

            // Handle collision with enemies
            enemies.forEach(enemy => {
                const dx = (enemy.x + enemy.width / 2 - 30) - (this.x + enemy.width / 2);
                const dy = (enemy.y + enemy.height / 2) - (this.y + enemy.height / 2 + 20);
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < enemy.width / 2 + this.width / 3) {
                    gameOver = true;
                }
            });

            // Handle player animation frames
            if (this.frameTimer > this.frameInterval) {
                if (this.frameX >= this.maxFrame) this.frameX = 0;
                else this.frameX++;
                this.frameTimer = 0;
            } else this.frameTimer += deltaTime;

            // Handle player movement
            if (input.keys.has('ArrowRight')) {
                this.speed = 5;
            } else if (input.keys.has('ArrowLeft')) {
                this.speed = -5;
            } else {
                this.speed = 0;
            }

            // Handle jumping
            if (input.keys.has('ArrowUp') && this.onGround(enemies) && !this.jumping) {
                this.vy = -30;
                this.jumping = true;
            }

            this.x += this.speed;
            if (this.x < 0) this.x = 0;
            else if (this.x > this.gameWidth - this.width) this.x = this.gameWidth - this.width;

            this.y += this.vy;
            if (!this.onGround(enemies)) {
                this.vy += this.gravity;
                this.frameY = 1;
                this.maxFrame = 5;
            } else {
                this.vy = 0;
                this.frameY = 0;
                this.maxFrame = 8;
                if (this.y > this.gameHeight - this.height) this.y = this.gameHeight - this.height;
                if (this.jumping) this.jumping = false;
            }
        }

        onGround(enemies) {
            return this.y >= this.gameHeight - this.height && !enemies.some(enemy => this.x + this.width > enemy.x && this.x < enemy.x + enemy.width && this.y + this.height > enemy.y);
        }
    }

    class InputHandler {
        constructor(player) {
            this.keys = new Set();
            this.touchStartX = 0;
            this.touchStartY = 0;
            this.touchThreshold = 30;
            this.player = player;

            window.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && gameOver) restartGame();
                this.keys.add(e.key);
                this.handleKeyPresses();
            });

            window.addEventListener('keyup', (e) => {
                this.keys.delete(e.key);
                this.handleKeyPresses();
            });

            window.addEventListener('touchstart', (e) => {
                this.touchStartX = e.changedTouches[0].pageX;
                this.touchStartY = e.changedTouches[0].pageY;
            });

            window.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const touchX = e.changedTouches[0].pageX;
                const touchY = e.changedTouches[0].pageY;
                const deltaX = touchX - this.touchStartX;
                const deltaY = touchY - this.touchStartY;

                if (Math.abs(deltaX) > this.touchThreshold) {
                    if (deltaX < 0) {
                        this.keys.add('ArrowLeft');
                        this.keys.delete('ArrowRight');
                    } else {
                        this.keys.add('ArrowRight');
                        this.keys.delete('ArrowLeft');
                    }
                } else {
                    this.keys.delete('ArrowLeft');
                    this.keys.delete('ArrowRight');
                }

                if (deltaY < -this.touchThreshold && this.player.onGround(enemies)) {
                    this.keys.add('ArrowUp');
                } else if (deltaY > this.touchThreshold) {
                    this.keys.add('ArrowDown');
                } else {
                    this.keys.delete('ArrowUp');
                    this.keys.delete('ArrowDown');
                }

                this.handleKeyPresses();
            });

            window.addEventListener('touchend', (e) => {
                this.keys.delete('ArrowLeft');
                this.keys.delete('ArrowRight');
                this.keys.delete('ArrowUp');
                this.keys.delete('ArrowDown');
                this.handleKeyPresses();

                if (gameOver) {
                    // Check for a swipe down gesture only when the game is over
                    const touchEndY = e.changedTouches[0].pageY;
                    const deltaY = touchEndY - this.touchStartY;
                    if (deltaY > this.touchThreshold) {
                        restartGame(); // Call the restartGame function on swipe down if game over
                    }
                }
            });
        }

        handleKeyPresses() {
            if (this.player) {
                this.player.handleInput(this.keys);
            }
        }
    }

    // class Explosion {
    //     constructor(x, y) {
    //         this.spriteWidth = 200;
    //         this.spriteHeight = 179;
    //         this.width = this.spriteWidth / 2;
    //         this.height = this.spriteHeight / 2;
    //         this.x = x - this.width / 2;
    //         this.y = y - this.height / 2;
    //         this.image = new Image();
    //         this.image.src = './images/boom.png';
    //         this.frame = 0;
    //         this.timer = 0;
    //     }
    //     update() {
    //         this.timer++;
    //         if (this.timer % 10 === 0) {
    //             this.frame++;
    //         }
    //     }
    //     draw() {
    //         ctx.drawImage(this.image, this.spriteWidth * this.frame, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
    //     }
    // }

    // window.addEventListener('click', function (e) {
    //     createExplosion(e);
    // });

    // function createExplosion(e) {
    //     let positionX = e.x - canvasPosition.left;
    //     let positionY = e.y - canvasPosition.top;
    //     explosions.push(new Explosion(positionX, positionY));
    // }

    const backgroundLayer1 = new Image();
    backgroundLayer1.src = './images/Parallax Forest Background - Blue/10Sky.png';

    const backgroundLayer2 = new Image();
    backgroundLayer2.src = './images/Parallax Forest Background - Blue/9Forest.png';

    const backgroundLayer3 = new Image();
    backgroundLayer3.src = './images/forrest-layer-2.png';

    const backgroundLayer4 = new Image();
    backgroundLayer4.src = './images/Parallax Forest Background - Blue/7Forest.png';

    const backgroundLayer5 = new Image();
    backgroundLayer5.src = './images/Parallax Forest Background - Blue/6Forest.png';

    const backgroundLayer6 = new Image();
    backgroundLayer6.src = './images/Parallax Forest Background - Blue/5Particles.png';

    const backgroundLayer7 = new Image();
    backgroundLayer7.src = './images/Parallax Forest Background - Blue/4Forest.png';

    const backgroundLayer8 = new Image();
    backgroundLayer8.src = './images/forrest-layer-4.png';

    const backgroundLayer9 = new Image();
    backgroundLayer9.src = './images/forrest-layer-5.png';

    const backgroundLayer10 = new Image();
    backgroundLayer10.src = './images/forrest-layer-5.png';

    const backgroundLayer11 = new Image();
    backgroundLayer11.src = './images/Parallax Forest Background - Blue/grass.png';

    class Enemy {
        constructor(gameWidth, gameHeight) {
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 160;
            this.height = 119;
            this.image = document.getElementById('worm');
            this.x = this.gameWidth;
            this.y = this.gameHeight - this.height;
            this.frameX = 0;
            this.maxFrame = 5;
            this.fps = 20;
            this.frameTimer = 0;
            this.frameInterval = 1000 / this.fps;
            this.speed = 7;
            this.markedForDeletion = false;
        }
        draw(ctx) {
            ctx.drawImage(this.image, this.frameX * this.width, 0, this.width, this.height, this.x, this.y, this.width, this.height);
        }
        update(deltaTime) {
            if (this.frameTimer > this.frameInterval) {
                if (this.frameX >= this.maxFrame) this.frameX = 0;
                else this.frameX++;
                this.frameTimer = 0;
            } else {
                this.frameTimer += deltaTime;
            }
            this.x -= this.speed;
            if (this.x < 0 - this.width) {
                this.markedForDeletion = true;
                score++;
            }
        }
    }

    function handleEnemies(deltaTime) {
        if (enemyTimer > enemyInterval + randomEnemyInterval) {
            enemies.push(new Enemy(canvas.width, canvas.height));
            randomEnemyInterval = Math.random() * 1000 + 100;
            enemyTimer = 0;
        } else {
            enemyTimer += deltaTime;
        }
        enemies.forEach(enemy => {
            enemy.draw(ctx);
            enemy.update(deltaTime);
        });
        enemies = enemies.filter(enemy => !enemy.markedForDeletion);
    }

    function displayStatusText(ctx) {
        ctx.textAlign = 'left';
        ctx.font = '40px Creepster, cursive';
        ctx.fillStyle = 'black';
        ctx.fillText('Score: ' + score, 20, 50)
        ctx.fillStyle = 'yellow';
        ctx.fillText('Score: ' + score, 24, 54)
        if (gameOver) {
            ctx.textAlign = 'center';
            ctx.font = '80px Creepster, cursive';
            ctx.fillStyle = 'black';
            ctx.fillText('GAMEOVER!!', canvas.width / 2, 150);
            ctx.fillText('press "ENTER" or Swipe "DOWN" to try again!', canvas.width / 2, 250);
            ctx.fillStyle = 'red';
            ctx.fillText('GAMEOVER!!', canvas.width / 2 + 6, 156);
            ctx.fillText('press "ENTER" or Swipe "DOWN" to try again!', canvas.width / 2 + 6, 256);
        }
    }

    function restartGame() {
        player.restart();
        enemies = [];
        score = 0;
        gameOver = false;
        animate(0);
    }

    const player = new Player(canvas.width, canvas.height);
    const input = new InputHandler(player);

    let lastTime = 0;
    let enemyTimer = 0;
    let enemyInterval = 1000;
    let randomEnemyInterval = Math.random() * 1000 + 100;

    class Layer {
        constructor(image, speedModifier) {
            this.x = 0;
            this.y = 0;
            this.width = 1600;
            this.height = 710;
            this.x2 = this.width;
            this.image = image;
            this.speedModifier = speedModifier;
            this.speed = gameSpeed * this.speedModifier;
        }
        update() {
            this.speed = gameSpeed * this.speedModifier;
            if (this.x <= -this.width) {
                this.x = this.width + this.x2 - this.speed;
            }
            if (this.x2 <= -this.width) {
                this.x2 = this.width + this.x - this.speed;
            }
            this.x = Math.floor(this.x - this.speed);
            this.x2 = Math.floor(this.x2 - this.speed);
        }

        draw() {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            ctx.drawImage(this.image, this.x2, this.y, this.width, this.height);
        }
    }

    const layer1 = new Layer(backgroundLayer1, 0.2);
    const layer2 = new Layer(backgroundLayer2, 0.4);
    const layer3 = new Layer(backgroundLayer3, 0.6);
    const layer4 = new Layer(backgroundLayer4, 0.8);
    const layer5 = new Layer(backgroundLayer5, 1);
    const layer6 = new Layer(backgroundLayer6, 1.5);
    const layer7 = new Layer(backgroundLayer7, 1.7);
    const layer8 = new Layer(backgroundLayer8, 1.9);
    const layer9 = new Layer(backgroundLayer9, 2);
    const layer10 = new Layer(backgroundLayer10, 2.5);
    const layer11 = new Layer(backgroundLayer11, 2.6);

    const layerObjects = [layer1, layer2, layer3, layer4, layer5, layer6, layer7, layer8, layer9, layer10, layer11];

    function animate(timeStamp) {
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // for (let i = 0; i < explosions.length; i++) {
        //     explosions[i].update();
        //     explosions[i].draw();
        //     if (explosions[i].frame > 5) {
        //         explosions.splice(i, 1);
        //         i--;
        //     }
        // }

        layerObjects.forEach(object => {
            object.update();
            object.draw();
        });

        player.draw(ctx);
        player.update(input, deltaTime);
        handleEnemies(deltaTime);
        layer11.draw(backgroundLayer11);

        displayStatusText(ctx);
        if (!gameOver) requestAnimationFrame(animate);
    }
    animate(0);
});