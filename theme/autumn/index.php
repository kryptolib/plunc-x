<!DOCTYPE html>
<html lang="en">
    <head>
        <title><?php echo page_title(); ?></title>
        <script type="text/javascript" src="http://127.0.0.1:5800/assets/plunc.js?mangle=false"></script>
        <script type="text/javascript"> const blockAutoSubmit=e=>e.preventDefault(); </script>
        <?php template_assets(); ?>
    </head>
    <body class="width-24">
        <app plunc-app="app" class="width-24"></app>
        <template plunc-name="app">
            
        </template>
    </body>
</html>