from pathlib import Path

path = Path('script.js')
text = path.read_text(encoding='utf-8')
start = text.find('function animate() {')
end = text.find('function startGame()', start)
if start == -1 or end == -1:
    raise SystemExit('Could not locate animate() or startGame() in script.js')
new_body = '''function animate() {
    window.requestAnimationFrame(animate)
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
    }

    items = items.filter((item) => item.active)
    items.forEach((item) => {
        if (!item.active) return
        if (!isGameOver) item.update()
        item.draw()
    })

    c.fillStyle = 'rgba(255, 255, 255, 0.085)'
    c.fillRect(0, 0, canvas.width, canvas.height)
    c.strokeStyle = 'rgba(255, 255, 255, 0.8)'
    c.lineWidth = 4
    c.strokeRect(2, 2, canvas.width - 4, canvas.height - 4)

    if (!isGameOver) {
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
            } else {
                player.switchSprite('idle')
            }
        }

        if (!enemy.dead) {
            if (enemyIsCpu) {
                const distanceToPlayer = player.position.x - enemy.position.x
                const horizontalDistance = Math.abs(distanceToPlayer)
                const playerIsPressingIn = (player.velocity.x > 0 && distanceToPlayer > 0) || (player.velocity.x < 0 && distanceToPlayer < 0)
                const playerIsAttackingThreat = player.isAttacking && horizontalDistance < 230

                const difficultySettings = {
                    easy: {
                        speed: 2.5,
                        preferredRange: 240,
                        retreatThreshold: 90,
                        jumpChance: 0.08,
                        attackChance: 0.25,
                        attackCooldown: 35,
                        jumpCooldown: 60
                    },
                    normal: {
                        speed: 3.5,
                        preferredRange: 210,
                        retreatThreshold: 110,
                        jumpChance: 0.2,
                        attackChance: 0.5,
                        attackCooldown: 24,
                        jumpCooldown: 45
                    },
                    hard: {
                        speed: 4.5,
                        preferredRange: 180,
                        retreatThreshold: 130,
                        jumpChance: 0.35,
                        attackChance: 0.8,
                        attackCooldown: 16,
                        jumpCooldown: 30
                    },
                    extreme: {
                        speed: 6.2,
                        preferredRange: 140,
                        retreatThreshold: 170,
                        jumpChance: 0.72,
                        attackChance: 0.99,
                        attackCooldown: 6,
                        jumpCooldown: 14
                    },
                    impossible: {
                        speed: 8.2,
                        preferredRange: 120,
                        retreatThreshold: 100,
                        jumpChance: 0.95,
                        attackChance: 1.0,
                        attackCooldown: 3,
                        jumpCooldown: 8
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
            } else {
                if (keys.ArrowLeft.pressed && enemy.lastKey === 'ArrowLeft') {
                    enemy.velocity.x = -5
                    enemy.switchSprite('run')
                } else if (keys.ArrowRight.pressed && enemy.lastKey === 'ArrowRight') {
                    enemy.velocity.x = 5
                    enemy.switchSprite('run')
                } else {
                    enemy.switchSprite('idle')
                }
            }
        }
    }

    if (player.speedBoostTimer > 0) player.speedBoostTimer--
    if (player.damageBoostTimer > 0) player.damageBoostTimer--
    if (enemy.speedBoostTimer > 0) enemy.speedBoostTimer--
    if (enemy.damageBoostTimer > 0) enemy.damageBoostTimer--

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

    if (isGameOver) {
        if (player.health > enemy.health && !enemy.dead) {
            enemy.switchSprite('death')
        } else if (enemy.health > player.health && !player.dead) {
            player.switchSprite('death')
        }
        return
    }

    const playerDamage = player.damageBoostTimer > 0 ? 8 : 5
    const enemyDamage = enemy.damageBoostTimer > 0 ? 8 : 5

    if (
        rectangularCollision({ rectangle1: player, rectangle2: enemy }) &&
        player.isAttacking && player.framesCurrent === 4
    ) {
        enemy.takeHit(playerDamage)
        player.isAttacking = false
        gsap.to('#enemyHealth', { width: enemy.health + '%' })
    }

    if (player.isAttacking && player.framesCurrent === 4) {
        player.isAttacking = false
    }

    if (
        rectangularCollision({ rectangle1: enemy, rectangle2: player }) &&
        enemy.isAttacking && enemy.framesCurrent === 2
    ) {
        player.takeHit(enemyDamage)
        enemy.isAttacking = false
        gsap.to('#playerHealth', { width: player.health + '%' })
    }

    if (enemy.isAttacking && enemy.framesCurrent === 2) {
        enemy.isAttacking = false
    }

    if (enemy.health <= 0 || player.health <= 0) {
        determineWinner({ player, enemy, timerId })
    }
}
'''
Path('script.js').write_text(text[:start] + new_body + text[end:], encoding='utf-8')
print('updated')
