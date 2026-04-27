<script lang="ts">
  import { onMount } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Field, FieldDescription, FieldGroup, FieldLabel } from '$lib/components/ui/field/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { cn } from '$lib/utils.js';
  import loginImage from '$lib/assets/forgot-password-image.jpg';

  let { class: className, ...restProps }: HTMLAttributes<HTMLDivElement> = $props();
  const id = $props.id();
</script>

<div class="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
  <div class="w-full max-w-sm md:max-w-3xl">
    <div class={cn('flex flex-col gap-6', className)} {...restProps}>
      <Card.Root class="overflow-hidden p-0">
        <Card.Content class="grid min-h-[550px] p-0 md:grid-cols-2">
          
          <form class="flex flex-col justify-center p-6 md:p-10">
            <FieldGroup>
              <div class="flex flex-col items-center gap-2 text-center mb-6">
                <h1 class="text-3xl font-bold">Reset Password</h1>
                <p class="text-balance text-muted-foreground">
                  Enter your email and we'll send a link to reset your Stripe password.
                </p>
              </div>
              
              <Field>
                <FieldLabel for="email-{id}">Email</FieldLabel>
                <Input id="email-{id}" type="email" placeholder="john@uiu.ac.bd" required />
              </Field>
              
              <Field class="mt-4">
                <Button type="submit" class="w-full">Send Reset Link</Button>
              </Field>
              
              <div class="mt-4 text-center text-sm">
                Remember your password? 
                <a href="/login" class="underline underline-offset-4 hover:text-primary">
                  Log in
                </a>
              </div>
            </FieldGroup>
          </form>

          <div class="relative hidden h-full w-full items-center justify-center border-l bg-black select-none md:flex overflow-hidden">
             <img src={loginImage} alt="Reset Password Background" class="absolute inset-0 h-full w-full object-cover opacity-80" />
          </div>
          
        </Card.Content>
      </Card.Root>
      <FieldDescription class="px-6 text-center">
        By clicking continue, you agree to our <a href="##">Terms of Service</a> and
        <a href="##">Privacy Policy</a>.
      </FieldDescription>
    </div>
  </div>
</div>