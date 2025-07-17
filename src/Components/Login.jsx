import * as React from 'react';
import { CssVarsProvider } from '@mui/joy/styles';
import Sheet from '@mui/joy/Sheet';
import CssBaseline from '@mui/joy/CssBaseline';
import Typography from '@mui/joy/Typography';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import Button from '@mui/joy/Button';
import Link from '@mui/joy/Link';
import Box from '@mui/joy/Box';
import photo from './photo.jpg';

export default function LoginPage() {
  return (
    <CssVarsProvider defaultMode="system">
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          minHeight: '100vh',
        }}
      >
        <Box
          sx={{
            width: { md: '50%' },
            height: { xs: 0, md: '100vh' },
            display: { xs: 'none', md: 'block' },
            backgroundImage: `url(${photo})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        <Box
          sx={{
            width: { xs: '100%', md: '50%' },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: { xs: 'center', md: 'flex' },
            alignItems: 'center',
            p: { xs: 2, md: 8 },
            minHeight: { xs: '100vh', md: 'auto' },
            backgroundColor: "rgba(230, 230, 230, 0.2)",
          }}
        >
          <Sheet
            variant="outlined"
            sx={{
              width: '100%',
              maxWidth: 450,
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              borderRadius: 'md',
              boxShadow: 'lg',
            }}
          >
            <div>
              <Typography level="h4" component="h1">
                <b>Hoş geldiniz!</b>
              </Typography>
              <Typography level="body-sm">Devam etmek için giriş yapın</Typography>
            </div>
            <FormControl>
              <FormLabel>Email</FormLabel>
              <Input name="email" type="email" placeholder="ornek@mail.com" />
            </FormControl>
            <FormControl>
              <FormLabel>Şifre</FormLabel>
              <Input name="password" type="password" placeholder="******" />
            </FormControl>
            <Button fullWidth>Giriş Yap</Button>
            <Typography
              endDecorator={<Link href="/">Kayıt Ol</Link>}
              sx={{ fontSize: 'sm', alignSelf: 'center' }}
            >
              Hesabınız yok mu?
            </Typography>
          </Sheet>
        </Box>
      </Box>
    </CssVarsProvider>
  );
}
