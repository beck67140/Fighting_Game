const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = 1024;
canvas.height = 576;

c.fillRect(0, 0, canvas.width, canvas.height);

const gravity = 0.7

const background = new Sprite({
    position: {
        x: 0,
        y: 0
    },
    imageSrc: 'background.png'
})

const shop = new Sprite({
    position: {
        x: 600,
        y: 128
    },
    imageSrc: 'shop.png',
    scale: 2.75,
    framesMax: 6
})

const player = new Fighter({
    position: {
    x: 94,
    y: 10
    },
    velocity:{
        x: 0,
        y: 10
    },
    offset: {
        x:0,
        y:0
    },
    imageSrc: './Mack/Idle (1).png',
    framesMax: 8,
    scale: 2.5,
    offset: {
        x:215,
        y:157
    },
    sprites: {
        idle: {
            imageSrc: './Mack/Idle (1).png',
            framesMax: 8
        },
        run: {
            imageSrc: './Mack/Run (1).png',
            framesMax: 8
        },
        jump: {
            imageSrc: './Mack/Jump (2).png',
            framesMax: 2
        },
        fall: {
            imageSrc: './Mack/Fall (1).png',
            framesMax: 2
        },
        attack1: {
            imageSrc: './Mack/Attack1 (1).png',
            framesMax: 6
        },
        takeHit: {
            imageSrc: './Mack/Take Hit v2.png',
            framesMax: 4
        },
        death: {
            imageSrc: './Mack/Death (1).png',
            framesMax: 6
        }
    },
    attackBox: {
        offset: {
            x: 100,
            y: 50,
        },
        width: 160,
        height: 50
    }
})

const enemy = new Fighter({
    position: {
    x: 900,
    y: 100
    },
    velocity:{
        x: 0,
        y: 0
    },
    color: 'blue',
    offset: {
        x: -50,
        y: 0
    },
    imageSrc: './Kenji/Idle.png',
    framesMax: 4,
    scale: 2.5,
    offset: {
        x:215,
        y:167
    },
    sprites: {
        idle: {
            imageSrc: './Kenji/Idle.png',
            framesMax: 4
        },
        run: {
            imageSrc: './Kenji/Run.png',
            framesMax: 8
        },
        jump: {
            imageSrc: './Kenji/Jump (1).png',
            framesMax: 2
        },
        fall: {
            imageSrc: './Kenji/Fall.png',
            framesMax: 2
        },
        attack1: {
            imageSrc: './Kenji/Attack1.png',
            framesMax: 4
        },
        takeHit: {
            imageSrc: './Kenji/Take hit.png',
            framesMax: 3
        },
        death: {
            imageSrc: './Kenji/Death.png',
            framesMax: 7
        }
    },
    attackBox: {
        offset: {
            x: -170,
            y: 50,
        },
        width: 170,
        height: 50
    }
})

const keys = {
    a: {
        pressed: false
    },
    d: {
        pressed: false
    },
    w: {
        pressed: false
    },
    s: {
        pressed: false
    },
    ArrowRight: {
        pressed: false
    },
    ArrowLeft: {
        pressed: false
    },
    ArrowUp: {
        pressed: false
    },
    ArrowDown: {
        pressed: false
    }
}

let items = []
let itemSpawnTimer = 300

let gameStarted = false
let gameOver = false
let loopStarted = false

window.endGame = () => {
    gameOver = true
}

const cpuToggleButton = document.getElementById('cpuToggle')
const restartButton = document.getElementById('restartButton')
const difficultyEasyButton = document.getElementById('difficultyEasy')
const difficultyNormalButton = document.getElementById('difficultyNormal')
const difficultyHardButton = document.getElementById('difficultyHard')
const difficultyExtremeButton = document.getElementById('difficultyExtreme')
const difficultyThrowupButton = document.getElementById('difficultyThrowup')
const difficultyImpossibleButton = document.getElementById('difficultyImpossible')
let enemyIsCpu = false
let enemyDifficulty = 'normal'
let enemyAttackCooldown = 0
let enemyJumpCooldown = 0
let enemyAiState = 'stance'
let playerAttackCooldown = 0
const ATTACK_COOLDOWN = 10 // frames between attacks when CPU mode is off

if (cpuToggleButton) {
    cpuToggleButton.addEventListener('click', () => {
        enemyIsCpu = !enemyIsCpu
        cpuToggleButton.textContent = `CPU: ${enemyIsCpu ? 'On' : 'Off'}`

        keys.ArrowRight.pressed = false
        keys.ArrowLeft.pressed = false
        keys.ArrowUp.pressed = false
        enemy.lastKey = undefined
    })
}

function setEnemyDifficulty(level) {
    enemyDifficulty = level
    const buttons = [difficultyEasyButton, difficultyNormalButton, difficultyHardButton, difficultyExtremeButton, difficultyThrowupButton, difficultyImpossibleButton]
    buttons.forEach((button) => {
        if (!button) return
        button.style.backgroundColor = ''
        button.style.color = ''
    })

    const activeButton = {
        easy: difficultyEasyButton,
        normal: difficultyNormalButton,
        hard: difficultyHardButton,
        extreme: difficultyExtremeButton,
        throwup: difficultyThrowupButton,
        impossible: difficultyImpossibleButton
    }[level]

    if (activeButton) {
        if (activeButton) {
            activeButton.style.backgroundColor = '#818CF8'
            activeButton.style.color = 'white'
        }
    }
}

if (difficultyEasyButton) difficultyEasyButton.addEventListener('click', () => setEnemyDifficulty('easy'))
if (difficultyNormalButton) difficultyNormalButton.addEventListener('click', () => setEnemyDifficulty('normal'))
if (difficultyHardButton) difficultyHardButton.addEventListener('click', () => setEnemyDifficulty('hard'))
if (difficultyExtremeButton) difficultyExtremeButton.addEventListener('click', () => setEnemyDifficulty('extreme'))
if (difficultyThrowupButton) difficultyThrowupButton.addEventListener('click', () => setEnemyDifficulty('throwup'))
if (difficultyImpossibleButton) difficultyImpossibleButton.addEventListener('click', () => setEnemyDifficulty('impossible'))
setEnemyDifficulty('normal')

function spawnRandomItem() {
    if (items.length >= 2) return

    const random = Math.random()
    const type = random < 0.33 ? 'health' : random < 0.66 ? 'speed' : 'damage'
    const x = 80 + Math.random() * (canvas.width - 160)
    const y = 80 + Math.random() * 220

    items.push(new Item({
        position: {x, y},
        type
    }))
}

function rectanglesOverlap(rectangle1, rectangle2) {
    return (
        rectangle1.position.x < rectangle2.position.x + rectangle2.width &&
        rectangle1.position.x + rectangle1.width > rectangle2.position.x &&
        rectangle1.position.y < rectangle2.position.y + rectangle2.height &&
        rectangle1.position.y + rectangle1.height > rectangle2.position.y
    )
}

function resetRound() {
    clearTimeout(timerId)

    timer = 90
    document.querySelector('#timer').innerHTML = timer
    document.querySelector('#displayText').style.display = 'none'
    document.querySelector('#playerHealth').style.width = '100%'
    document.querySelector('#enemyHealth').style.width = '100%'

    player.reset()
    enemy.reset()
    player.position.x = 94
    player.position.y = 10
    enemy.position.x = 900
    enemy.position.y = 100
    player.velocity.x = 0
    player.velocity.y = 10
    enemy.velocity.x = 0
    enemy.velocity.y = 0
    player.lastKey = undefined
    enemy.lastKey = undefined

    Object.keys(keys).forEach((key) => {
        keys[key].pressed = false
    })

    enemyAttackCooldown = 0
    enemyJumpCooldown = 0
    enemyAiState = 'stance'
    playerAttackCooldown = 0
    items = []
    itemSpawnTimer = 300

    // stop the game loop and return to main menu
    gameStarted = false
    gameOver = false
    const mainMenu = document.getElementById('mainMenu')
    if (mainMenu) mainMenu.style.display = 'flex'
}

if (restartButton) restartButton.addEventListener('click', resetRound)

function animate() {
    window.requestAnimationFrame(animate);
    c.fillStyle = 'black'
    c.fillRect(0, 0, canvas.width, canvas.height)
    background.update()
    shop.update()

    if (!gameStarted && !gameOver) return

    const isGameOver = gameOver

    if (!isGameOver) {
        itemSpawnTimer--
        if (itemSpawnTimer <= 0) {
            spawnRandomItem()
            itemSpawnTimer = 300 + Math.floor(Math.random() * 180)
        }

        items = items.filter((item) => item.active)
        items.forEach((item) => {
            item.update()
            item.draw()
        })
    }

    c.fillStyle = 'rgba(255, 255, 255, 0.085)'
    c.fillRect(0,0, canvas.width, canvas.height)
    c.strokeStyle = 'rgba(255, 255, 255, 0.75)'
    c.lineWidth = 4
    c.strokeRect(2, 2, canvas.width - 4, canvas.height - 4)

    if (isGameOver) {
        player.velocity.x = 0
        enemy.velocity.x = 0

        if (player.health > enemy.health && !enemy.dead) {
            enemy.switchSprite('death')
        } else if (enemy.health > player.health && !player.dead) {
            player.switchSprite('death')
        }

        player.update()
        enemy.update()
        return
    }

    player.velocity.x = 0
    enemy.velocity.x = 0

    const playerMoveSpeed = player.speedBoostTimer > 0 ? player.moveSpeed + 2 : player.moveSpeed

    if (!player.dead) {
        if (keys.a.pressed && player.lastKey === 'a') {
            player.velocity.x = -playerMoveSpeed
            player.switchSprite('run')
        } else if (keys.d.pressed && player.lastKey === 'd') {
            player.velocity.x = playerMoveSpeed
            player.switchSprite('run')
        } else if (!isGameOver) {
            player.switchSprite('idle')
        }
    }

    if (!isGameOver) {
        items.forEach((item) => {
            if (!item.active) return

            if (rectanglesOverlap(player, item)) {
                item.active = false

                if (item.type === 'health') {
                    player.health = Math.min(100, player.health + 25)
                    gsap.to('#playerHealth', {
                        width: player.health + '%'
                    })
                } else if (item.type === 'speed') {
                    player.speedBoostTimer = 300
                } else {
                    player.damageBoostTimer = 300
                }
            }
        })

        items.forEach((item) => {
            if (!item.active) return

            if (rectanglesOverlap(enemy, item)) {
                item.active = false

                if (item.type === 'health') {
                    enemy.health = Math.min(100, enemy.health + 25)
                    gsap.to('#enemyHealth', {
                        width: enemy.health + '%'
                    })
                } else if (item.type === 'speed') {
                    enemy.speedBoostTimer = 300
                } else {
                    enemy.damageBoostTimer = 300
                }
            }
        })
    }

    if (player.speedBoostTimer > 0) {
        player.speedBoostTimer--
    }
    if (player.damageBoostTimer > 0) {
        player.damageBoostTimer--
    }

    if (enemy.speedBoostTimer > 0) {
        enemy.speedBoostTimer--
    }
    if (enemy.damageBoostTimer > 0) {
        enemy.damageBoostTimer--
    }

    if (enemyIsCpu && !enemy.dead && !isGameOver) {
        const distanceToPlayer = player.position.x - enemy.position.x
        const horizontalDistance = Math.abs(distanceToPlayer)
        const playerIsPressingIn = (player.velocity.x > 0 && distanceToPlayer > 0) || (player.velocity.x < 0 && distanceToPlayer < 0)
        const playerIsAttackingThreat = player.isAttacking && horizontalDistance < 230

        const difficultySettings = {
            easy: {
                speed: 8.2,
                preferredRange: 150,
                retreatThreshold: 90,
                jumpChance: 0.08,
                attackChance: 0.25,
                attackCooldown: 35,
                jumpCooldown: 60
            },
            normal: {
                speed: 8.2,
                preferredRange: 150,
                retreatThreshold: 110,
                jumpChance: 0.2,
                attackChance: 0.5,
                attackCooldown: 24,
                jumpCooldown: 45
            },
            hard: {
                speed: 8.2,
                preferredRange: 135,
                retreatThreshold: 130,
                jumpChance: 0.4,
                attackChance: 0.8,
                attackCooldown: 16,
                jumpCooldown: 30
            },
            extreme: {
                speed: 8.2,
                preferredRange: 125,
                retreatThreshold: 130,
                jumpChance: 0.6,
                attackChance: 0.9,
                attackCooldown: 6,
                jumpCooldown: 15
            },
            throwup: {
                speed: 10,
                preferredRange: 123,
                retreatThreshold: 80,
                jumpChance: 0.3,
                attackChance: 0.95,
                attackCooldown: 3,
                jumpCooldown: 13
            },
            impossible: {
                speed: 16.4,
                preferredRange: 120,
                retreatThreshold: 60,
                jumpChance: 0.1,
                attackChance: 100,
                attackCooldown: 0,
                jumpCooldown: 10
            }
        }

        const settings = difficultySettings[enemyDifficulty] || difficultySettings.normal
        const preferredRange = enemy.health < 35 ? settings.preferredRange - 40 : player.health < 35 ? settings.preferredRange - 20 : settings.preferredRange
        const isTooClose = horizontalDistance < settings.retreatThreshold
        const isTooFar = horizontalDistance > preferredRange + 40
        const shouldRetreat = isTooClose || (playerIsAttackingThreat && horizontalDistance < 230)
        const shouldPressure = horizontalDistance > preferredRange - 40 && horizontalDistance < preferredRange + 90

        if (enemy.isGrounded) {
            const impossibleMode = enemyDifficulty === 'impossible'
            const shouldRetreatAdjusted = impossibleMode ? false : shouldRetreat
            if (shouldRetreatAdjusted) {
                enemy.velocity.x = distanceToPlayer > 0 ? -settings.speed : settings.speed
                enemy.lastKey = distanceToPlayer > 0 ? 'ArrowLeft' : 'ArrowRight'
                enemy.switchSprite('run')
                enemyAiState = 'retreat'
            } else if (isTooFar) {
                enemy.velocity.x = distanceToPlayer > 0 ? settings.speed : -settings.speed
                enemy.lastKey = distanceToPlayer > 0 ? 'ArrowRight' : 'ArrowLeft'
                enemy.switchSprite('run')
                enemyAiState = 'approach'
            } else if (shouldPressure || impossibleMode) {
                enemy.velocity.x = 0
                enemy.switchSprite('idle')
                enemyAiState = impossibleMode ? 'attack' : 'pressure'
            } else {
                enemy.velocity.x = 0
                enemy.switchSprite('idle')
                enemyAiState = 'stance'
            }

            const shouldJump = enemy.isGrounded && enemyJumpCooldown <= 0 && (
                (playerIsAttackingThreat && Math.random() < settings.jumpChance + 0.1) ||
                (horizontalDistance < preferredRange - 20 && Math.abs(player.velocity.y) > 0 && Math.random() < settings.jumpChance) ||
                (horizontalDistance < preferredRange - 50 && playerIsPressingIn && Math.random() < settings.jumpChance + 0.05)
            )

            if (shouldJump) {
                enemy.jump()
                enemyJumpCooldown = settings.jumpCooldown
            }

            const canAttack = enemy.isGrounded && enemyAttackCooldown <= 0 && horizontalDistance < preferredRange + 40 && horizontalDistance > 40
            const shouldAttack = enemyDifficulty === 'impossible'
                ? canAttack
                : canAttack && (
                    (playerIsAttackingThreat && Math.random() < settings.attackChance + 0.15) ||
                    (horizontalDistance < preferredRange - 20 && Math.random() < settings.attackChance) ||
                    (playerIsPressingIn && horizontalDistance < preferredRange - 10 && Math.random() < settings.attackChance - 0.1)
                )

            if (shouldAttack) {
                enemy.attack()
                enemyAttackCooldown = settings.attackCooldown + (enemyDifficulty === 'impossible' ? 0 : Math.floor(Math.random() * 4))
            }

            enemyAttackCooldown = Math.max(0, enemyAttackCooldown - 1)
            enemyJumpCooldown = Math.max(0, enemyJumpCooldown - 1)
        }
    } else if (!enemyIsCpu && !enemy.dead) {
        if (keys.ArrowLeft.pressed && enemy.lastKey === 'ArrowLeft') {
            enemy.velocity.x = -5
            enemy.switchSprite('run')
        } else if (keys.ArrowRight.pressed && enemy.lastKey === 'ArrowRight') {
            enemy.velocity.x = 5
            enemy.switchSprite('run')
        } else {
            enemy.switchSprite('idle')
        }
    } else if (!enemy.dead && !isGameOver) {
        enemy.switchSprite('idle')
    }

    // jumping
    if (player.velocity.y < 0) {
        player.switchSprite('jump')
    } else if (player.velocity.y > 0) {
        player.switchSprite('fall')
    }

    if (enemy.velocity.y < 0) {
        enemy.switchSprite('jump')
    } else if (enemy.velocity.y > 0) {
        enemy.switchSprite('fall')
    }

    player.update()
    enemy.update()

    // Decrement attack cooldown for manual controls (when CPU mode is off)
    playerAttackCooldown = Math.max(0, playerAttackCooldown - 1)

    const playerDamage = player.damageBoostTimer > 0 ? 8 : 5
    const enemyDamage = enemy.damageBoostTimer > 0 ? 8 : 5

    // detect collision
    if (
        rectangularCollision({
            rectangle1: player,
            rectangle2: enemy
        }) &&
        player.isAttacking && player.framesCurrent === 4
    ) {
        enemy.takeHit(playerDamage)
        player.isAttacking = false
        gsap.to('#enemyHealth', {
            width: enemy.health + '%'
        })
    }

    if (player.isAttacking && player.framesCurrent === 4) {
        player.isAttacking = false
    }

    if (
        rectangularCollision({
            rectangle1: enemy,
            rectangle2: player
        }) &&
        enemy.isAttacking && enemy.framesCurrent === 2
    ) {
        player.takeHit(enemyDamage)
        enemy.isAttacking = false
        gsap.to('#playerHealth', {
            width: player.health + '%'
        })
    }

    if (enemy.isAttacking && enemy.framesCurrent === 2) {
        enemy.isAttacking = false
    }

    if (enemy.health <= 0 || player.health <= 0) {
        determineWinner({player, enemy, timerId})
    }
}


function startGame() {
    if (gameStarted) return
    gameStarted = true
    gameOver = false
    const mainMenu = document.getElementById('mainMenu')
    if (mainMenu) mainMenu.style.display = 'none'
    const displayText = document.querySelector('#displayText')
    if (displayText) displayText.style.display = 'none'
    decreaseTimer()
    if (!loopStarted) {
        loopStarted = true
        animate()
    }
}

const playButton = document.getElementById('playButton')
if (playButton) playButton.addEventListener('click', startGame)

window.addEventListener('keydown', (event) => {
    if (!gameStarted || gameOver) return
    if (!player.dead) {
        switch (event.key) {
            case 'd':
                keys.d.pressed = true
                player.lastKey = 'd'
                break
            case 'a':
                keys.a.pressed = true
                player.lastKey = 'a'
                break
            case 'w':
                player.jump()
                break
            case 's':
                if (!keys.s.pressed) {
                    keys.s.pressed = true
                    if (playerAttackCooldown <= 0) {
                        player.attack()
                        playerAttackCooldown = ATTACK_COOLDOWN
                    }
                }
                break
        }
    }

    if (!enemy.dead && !enemyIsCpu) {
        switch(event.key) {
            case 'ArrowRight':
                keys.ArrowRight.pressed = true
                enemy.lastKey = 'ArrowRight'
                break
            case 'ArrowLeft':
                keys.ArrowLeft.pressed = true
                enemy.lastKey = 'ArrowLeft'
                break
            case 'ArrowUp':
                enemy.jump()
                break
            case 'ArrowDown':
                if (!keys.ArrowDown.pressed) {
                    keys.ArrowDown.pressed = true
                    if (playerAttackCooldown <= 0) {
                        enemy.attack()
                        playerAttackCooldown = ATTACK_COOLDOWN
                    }
                }
                break
        }
    }
})

window.addEventListener('keyup', (event) => {
    if (!gameStarted || gameOver) return
    switch (event.key) {
        case 'd':
            keys.d.pressed = false
            break
        case 'a':
            keys.a.pressed = false
            break
        case 'w':
            keys.w.pressed = false
            break
        case 's':
            keys.s.pressed = false
            break
//  enemy
        case 'ArrowRight':
            keys.ArrowRight.pressed = false
            break
        case 'ArrowLeft':
            keys.ArrowLeft.pressed = false
            break
        case 'ArrowUp':
            keys.ArrowUp.pressed = false
            break
        case 'ArrowDown':
            keys.ArrowDown.pressed = false
            break
    }
})
