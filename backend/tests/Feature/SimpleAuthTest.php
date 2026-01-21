<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SimpleAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_simple()
    {
        $this->assertTrue(true);
    }
}