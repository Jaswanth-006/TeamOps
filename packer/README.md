# Packer — Golden AMIs

Pre-baked machine images for the web and app tiers. Baking the runtime into a custom AMI means Auto
Scaling launches instances that boot **ready to serve** (~60s) instead of installing nginx, Node,
and pm2 first (~5 min) — which matters a lot when scaling out under load or replacing a failed
instance.

## What each image bakes in

| Image | Baked runtime | Still done at boot (in user data) |
|-------|---------------|-----------------------------------|
| `teamops-web` | nginx, Node 22, git | clone code, `npm run build`, write nginx config, start nginx |
| `teamops-app` | Node 22, pm2, git | clone code, `npm install`, `prisma migrate deploy`, `pm2 start` |

The *runtime* is baked (it rarely changes); the *application code* is still pulled at boot (it
changes on every deploy).

## Layout

```
packer/
├── web/  web.pkr.hcl + setup.sh   → builds "teamops-web-<timestamp>"
└── app/  app.pkr.hcl + setup.sh   → builds "teamops-app-<timestamp>"
```

## Build the images

```bash
# Requires: packer installed, AWS credentials configured.
cd packer/web && packer init . && packer build .
cd ../app     && packer init . && packer build .
```

Each produces an AMI in your account named `teamops-web-*` / `teamops-app-*`.

## How Terraform uses them

`infrastructure/data.tf` looks up the most recent `teamops-web-*` and `teamops-app-*` AMIs (owned by
your account) and feeds them to the launch templates. So the workflow is:

1. `packer build` both images (once, and again whenever the runtime changes).
2. `terraform apply` — the launch templates pick up the latest golden AMIs automatically.

> If you `terraform apply` before building the AMIs, the AMI lookups will fail — build the images
> first. (A base Amazon Linux image with heavier boot-time installs is the fallback the earlier
> user-data scripts described.)
