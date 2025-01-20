<?php 

namespace Kryptolib\PluncX\Handlers;

use Kryptolib\PluncX\App\DependencyItem;
use Kryptolib\PluncX\App\DependencyService;
use Kryptolib\PluncX\Components\ComponentRegistry;
use Kryptolib\PluncX\Factories\FactoryRegistry;
use Kryptolib\PluncX\Helpers\HelperRegistry;
use Kryptolib\PluncX\Services\ServiceRegistry;

class HandlerGenerator {

    /**
     * All imported variables from external sources, stored in the form of 
     * `$variable => $unique_name`
     * 
     * @example: 
     * import { TextInput, getTextInput } from "../Forms/Input/TextInput/TextInput";
     * 
     * Would store: 
     * $imported_external_vars["TextInput"] = "TextInput_1"
     * $imported_external_vars["getTextInput"] = "TextInput_1"
     * 
     * @var array
     */
    private array $imported_external_vars = [];

    /**
     * An array of dependencies, stored using its unique name
     * @var array
     */
    private array $dependencies_unique_names = [];

    private HandlerName $HandlerName;

    /**
     * The shell script encompases all the 
     * @var string
     */
    private string $shellscript = '';

    private static array $PluncX = [
        'Pluncx.scope()'     => '$scope',
        'Pluncx.patch'       => '$patch',
        'Pluncx.block'       => '$block',
        'Pluncx.parent()'    => '$parent',
        'Pluncx.app()'       => '$app',
        'Pluncx.component()' => '$component',
        'Pluncx.AppService'  => 'AppService'
    ];

    public function __construct(
        private DependencyItem $DependencyItem
    ){
        switch ($DependencyItem->type) {
            case HandlerType::COMPONENT: 
                $ComponentModel = ComponentRegistry::find(
                    jspath: $DependencyItem->abspath
                );
                $this->HandlerName = $ComponentModel->name;
                break;
            case HandlerType::FACTORY:
                $FactoryModel = FactoryRegistry::find(
                    $DependencyItem->abspath
                );
                $this->HandlerName = $FactoryModel->name;
                break;
            case HandlerType::SERVICE: 
                $ServiceModel = ServiceRegistry::find(
                    $DependencyItem->abspath
                );
                $this->HandlerName = $ServiceModel->name;
                break;
            case HandlerType::HELPER: 
                $ServiceModel = HelperRegistry::find(
                    $DependencyItem->abspath
                );
                $this->HandlerName = $ServiceModel->name;
                break;
            case HandlerType::TEMPLATE: 
                $this->HandlerName = new HandlerName(
                    object: 'AppService',
                    real: 'AppService',
                    unique: 'AppService',
                    minified: 'AppService'
                );
            default:
                break;
        }
    }

    public function generate(): string {

        if ($this->DependencyItem->type === HandlerType::PLUNCX) return '';

        $this->parse_dependencies();

        $generated_script = $this->generate_shell_script();
        $generated_script = $this->inject_dependency_unique_names($generated_script);
        $generated_script = $this->inject_import_variable_reference_mappings($generated_script);
        $generated_script = $this->inject_handler_script($generated_script);
        $generated_script = $this->resolve_pluncx_constants($generated_script);

        return $generated_script;
    }

    private function generate_shell_script() {
        $typemap = [
            HandlerType::COMPONENT => 'component',
            HandlerType::FACTORY => 'factory',
            HandlerType::SERVICE => 'service',
            HandlerType::HELPER => 'helper',
            HandlerType::TEMPLATE => 'service'
        ];
        $shell = 'app.%s("%s", (===DEPENDENCY_UNIQUE_NAMES===) => {'.PHP_EOL;
        $shell .= '===IMPORT_VARIABLE_REFERENCE_MAPPINGS==='.PHP_EOL;
        $shell .= '===HANDLER_CONTENT==='.PHP_EOL;
        $shell .= '===HANDLER_RETURN_STATEMENT==='.PHP_EOL;
        $shell .= '});'.PHP_EOL;
        return sprintf(
            $shell,
            $typemap[$this->DependencyItem->type],
            $this->HandlerName->unique
        );
    }

    private function inject_dependency_unique_names(
        string $script
    ): string {
        return str_replace(
            '===DEPENDENCY_UNIQUE_NAMES===',
            implode(',', $this->dependencies_unique_names),
            $script
        );
    }

    private function inject_import_variable_reference_mappings (
        string $script
    ) {
        $import_variable_mappings = '';
        foreach ($this->imported_external_vars as $variable => $uniquename) {
            if (substr($uniquename, 0, 1) === '@') {
                $uniquename = str_replace('@', '', $uniquename);
                /** Special case for factories */
                $import_variable_mappings .= '    const ' . $variable . ' = ' .$uniquename . ';'.PHP_EOL;
            } else {
                $import_variable_mappings .= '    const ' . $variable . ' = ' .$uniquename . '.' . $variable . ';'.PHP_EOL;
            }
        }
        return str_replace(
            '===IMPORT_VARIABLE_REFERENCE_MAPPINGS===',
            $import_variable_mappings,
            $script
        );
    }

    private function inject_handler_script (
        string $script
    ) {
        # Removes all export keywords
        $lines = explode(separator: "\n", string: $this->DependencyItem->content);
        $content = '';
        $exports = [];
        foreach ($lines as $line) {
            if (trim(string: $line) === '') continue;

            /** Retrieving and removing each and every import statements */
            if (count(DependencyService::imports(content: $line)) > 0) continue;

            $result = substr(string: $line, offset: 0, length: 7);
            if ($result !== 'export ') {
                $content .= '    ' . rtrim($line).PHP_EOL;
                continue;
            }
            # Extracting variable names from export declarations
            $pattern = '/export\s+(?:const|let|var|function|class)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/';
            if (preg_match_all(pattern: $pattern, subject: $line, matches: $matches)) {
                $variable = $matches[1];
                array_push($exports, ...$variable);
            } 
            $content .= '    ' .  substr($line, 7).PHP_EOL;
        }

        $script = str_replace(
            '===HANDLER_CONTENT===',
            $content,
            $script
        );

        if ($this->DependencyItem->type !== HandlerType::FACTORY) {
            $returns = '    return {'.PHP_EOL;
            $i = 1;
            foreach ($exports as $export) {
                $comma = ($i < count($exports)) ? ',' : '';
                $returns .= '        ' . $export . ': '.$export.$comma.PHP_EOL;
                $i++;
            }
            $returns .= '    }';
        } else {
            $returns = '    return ' . $exports[0] . ';';
        }
        
        $script = str_replace(
            '===HANDLER_RETURN_STATEMENT===',
            $returns,
            $script
        );

        return $script;

    }

    private function resolve_pluncx_constants(
        string $script
    ){
        foreach (self::$PluncX as $method => $api) {
            $script = str_replace($method, $api, $script);
        }
        return $script;
    }

    private function parse_dependencies(): void {

        /** Retrieving each and every import statements */
        foreach (DependencyService::imports(content: $this->DependencyItem->content) as $import_statement) {

            /** All import variables within import statements */
            $comma_separated_variables_from_import = $this->variables_from_import_statement(
                import_statement: $import_statement
            );

            /** Maybe this happens? */
            if (trim($comma_separated_variables_from_import) === '') continue;

            /** An array of imported variables, trimmmed */
            $imported_variables = array_map(
                callback: 'trim', 
                array: explode(
                    separator: ',', 
                    string: $comma_separated_variables_from_import
                )
            );

            /** Let's retrieve the object behind the import statement */
            $relpaths = DependencyService::relpaths(content: $import_statement);
            $dependency_path = DependencyService::locate(
                sourcepath: $this->DependencyItem->abspath,
                targetpath: $relpaths[0]
            );
            switch (HandlerService::type($dependency_path)) {
                case HandlerType::COMPONENT: 
                    $DependencyComponent = ComponentRegistry::find(
                        jspath: $dependency_path
                    );
                    foreach ($imported_variables as $imported_variable) {
                        $this->imported_external_vars[$imported_variable] 
                            = $DependencyComponent->name->unique;
                    }
                    array_push(
                        $this->dependencies_unique_names,
                        $DependencyComponent->name->unique
                    );
                    break;
                case HandlerType::FACTORY: 
                    $DependencyFactory = FactoryRegistry::find(
                        $dependency_path
                    );
                    foreach ($imported_variables as $imported_variable) {
                        $this->imported_external_vars[$imported_variable] 
                            = '@' . $DependencyFactory->name->unique;
                    }
                    array_push(
                        $this->dependencies_unique_names,
                        $DependencyFactory->name->unique
                    );
                    break;
                case HandlerType::SERVICE: 
                    $DependencyService = ServiceRegistry::find(
                        absolute_path: $dependency_path
                    );
                    foreach ($imported_variables as $imported_variable) {
                        $this->imported_external_vars[$imported_variable] 
                            = $DependencyService->name->unique;
                    }
                    array_push(
                        $this->dependencies_unique_names,
                        $DependencyService->name->unique
                    );
                    break;
                case HandlerType::HELPER: 
                    $DependencyService = HelperRegistry::find(
                        absolute_path: $dependency_path
                    );
                    foreach ($imported_variables as $imported_variable) {
                        $this->imported_external_vars[$imported_variable] 
                            = $DependencyService->name->unique;
                    }
                    array_push(
                        $this->dependencies_unique_names,
                        $DependencyService->name->unique
                    );
                    break;
                case HandlerType::PLUNCX: 
                    foreach (self::$PluncX as $method => $api) {
                        if (str_contains($this->DependencyItem->content, $method)) {
                            array_push(
                                $this->dependencies_unique_names,
                                $api
                            );
                        }
                    }
                    break;
                default: 
                    break;
            }
        }
    }

    private function variables_from_import_statement(
        string $import_statement
    ): string{
        $pattern = '/import\s+\{\s*([^}]+)\s*\}\s+from/';
        (preg_match(pattern: $pattern, subject: $import_statement, matches: $matches));
        return $matches[1];
    }

}