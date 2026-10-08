<?php
// Temporary file to check PHP configuration
echo "Fileinfo Extension: " . (extension_loaded('fileinfo') ? 'ENABLED' : 'DISABLED') . "\n";
echo "PHP Version: " . phpversion() . "\n";
echo "Loaded php.ini: " . php_ini_loaded_file() . "\n";
