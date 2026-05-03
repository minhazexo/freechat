<!DOCTYPE html>
<html lang="<?php echo e(str_replace('_', '-', app()->getLocale())); ?>">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Chitchat - Anonymous Chat</title>
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,600&display=swap" rel="stylesheet" />
        <style>
            body {
                font-family: 'Figtree', sans-serif;
                margin: 0;
                padding: 0;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
                text-align: center;
                color: white;
                padding: 2rem;
            }
            h1 {
                font-size: 4rem;
                margin-bottom: 1rem;
            }
            p {
                font-size: 1.25rem;
                margin-bottom: 2rem;
                opacity: 0.9;
            }
            .btn {
                display: inline-block;
                padding: 1rem 2rem;
                background: white;
                color: #667eea;
                text-decoration: none;
                border-radius: 0.5rem;
                font-weight: 600;
                transition: transform 0.2s;
            }
            .btn:hover {
                transform: translateY(-2px);
            }
            .api-link {
                margin-top: 2rem;
                font-size: 0.875rem;
                opacity: 0.7;
            }
            .api-link a {
                color: white;
                text-decoration: underline;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Chitchat</h1>
            <p>Anonymous chat application powered by Laravel + React</p>
            <a href="/app" class="btn">Launch App</a>
            <div class="api-link">
                <p>API Documentation: <a href="/api">/api</a></p>
            </div>
        </div>
    </body>
</html>
<?php /**PATH E:\Project\freechatt\freechat\backend\resources\views/welcome.blade.php ENDPATH**/ ?>