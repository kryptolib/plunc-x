<!DOCTYPE html>
<html lang="en">
    <head>
        <title><?php echo page_title(); ?></title>
        <script type="text/javascript" src="http://127.0.0.1:5800/assets/plunc.js?mangle=false"></script>
        <script type="text/javascript"> const blockAutoSubmit=e=>e.preventDefault(); </script>
        <?php template_assets(); ?>
    </head>
    <body>
        <app plunc-app="app"></app>
        <template plunc-name="app">
            <main plunc-component="AppRouter_1"></main>
        </template>
        <?php new Kryptolib\PluncX\Component('Pluncx/AppRouter'); ?>
        <?php Kryptolib\PluncX\Component::export(); ?>
    </body>
</html>