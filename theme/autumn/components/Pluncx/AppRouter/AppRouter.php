<div plunc-if="state == 'loading'">
</div>
<div plunc-if="state == 'active'">
    <?php template_content(); ?>
</div>
<div plunc-if="state == 'error'">
</div>