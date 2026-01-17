---
layout: post
title: My setup for learning eBPF
tags: [ebpf, c]
---

I recently set up a virtual machine on my M1 MacBook which I intend to use as
a playground for learning [eBPF](https://ebpf.io/){:target="_blank"}. This is
the process I took to set it up.

## Some context
Conventionally, applications execute in userland, isolated from the kernel and
each other to avoid an errant (or malicious) program from affecting the computer
as a whole.

eBPF is a rapidly growing technology which breaks this separation
and enables running carefully restricted and verified custom programs in the
kernel space. This enables some great benefits. eBPF programs can peer into the
inner workings of the kernel, and can run with great efficiency, as data does
not need to be copied between kernel space and userland via expensive syscalls.

<figure>
	<img src="{{site.baseurl}}/assets/ebpf_architecture.webp">
	<figcaption>An overview of the eBPF architecture. Source: <a href="https://ebpf.io/what-is-ebpf/" target="_blank">https://ebpf.io/what-is-ebpf/</a></figcaption>
</figure>

I'm super interested in understanding the world of possibilities that eBPF
enables, and exploring pushing the limits of what it's meant for. There's just
one hurdle: eBPF is a Linux kernel technology, and I'm on a MacBook.

## Setting up
My goal is an eBPF playground. I want to be able to write, compile, and execute
eBPF code to see what it is capable of. Since there's going to be lots of trial
and error, I wanted the development experience to be as ergonomic as possible.

I briefly considered if a Docker container was possible, since I know Docker on
macOS runs its own Linux virtual machine (VM) under the hood. But after some
googling, it seemed a bit complicated, so I decided to go with the more manual
option of managing my own VM.

The setup was actually super simple, and honestly is not even eBPF specific! It
feels nice to have a toy Linux environment at my disposal again. I grew up on
Linux and only recently switched to macOS to be more integrated with the rest of
the Apple ecosystem.

### 1. Setting up the VM
I chose [UTM](https://mac.getutm.app/){:target="_blank"} as my VM manager, since
unlike something like VirtualBox it treats macOS as a first-class citizen, and
I'm not smart enough to figure out how to use the bare `qemu` on my own. Once
downloaded, I was immediately able to start creating my Linux VM.

<figure>
	<img src="{{site.baseurl}}/assets/utm_splash.png">
</figure>
<figure>
	<img src="{{site.baseurl}}/assets/utm_virtualize.png">
	<figcaption>The goal here is to make this thing as performant as possible, so
	I'll stick to ARM instructions that my M1 chip already knows how to interpret.</figcaption>
</figure>
<figure>
	<img src="{{site.baseurl}}/assets/utm_linux.png">
	<figcaption>The whole point of all this!</figcaption>
</figure>
<figure>
	<img src="{{site.baseurl}}/assets/utm_config.png">
	<figcaption>I gave it pretty reasonable resources to work with, but unchecked display
output, as I won't be using a the virtual OS's GUI interface at all.</figcaption>
</figure>

Finally, we are asked to select an ISO image for the OS we wish to use. I
decided to go with the latest LTS of Ubuntu Server (24.04), since again, I don't
need the desktop environment included with the default Ubuntu. When grabbing it
off the website, I downloaded the ARM edition, since my MacBook has an M1 ARM
chip in it.

<figure>
	<img src="{{site.baseurl}}/assets/utm_avail.png">
</figure>

<figure>
<img src="{{site.baseurl}}/assets/utm_arm.png">
</figure>

<figure>
<img src="{{site.baseurl}}/assets/utm_iso.png">
</figure>

I configured the VM to have 32 GB of space (we don't need that space much to
just be running some eBPF programs), and left the remainder of the configuration
options at their defaults (no shared directory, no custom VM settings).

And with that, we are ready to launch!

<figure>
<img src="{{site.baseurl}}/assets/utm_launch.png">
</figure>

### 2. Launching and installing
After clicking the play button in the UTM UI, a little terminal window will pop
up as the VM boots, and then our good friend the GRUB boot menu appears. I
selected the "Ubuntu Server with the HWE kernel", since a cursory googling
told me that HWE uses a newer version of the Linux kernel and may have juicy
new features (specifically what those are, I don't know, and I definitely could
get by just fine on a default install, but it makes my brain feel good to have
all the latest trinkets).

<figure>
<img src="{{site.baseurl}}/assets/utm_hwe.png">
</figure>
<figure>
<img src="{{site.baseurl}}/assets/utm_rich.png">
<figcaption>The installer realizes we haven't got a display (because I unchecked
the box earlier), and asks if the terminal we're using supports colors. With
what UTM provides, it does, so we can proceed in rich mode.</figcaption>
</figure>

From here on out, the installer will provide sensible defaults for the majority
of options. I tapped enter to skip through the language selection, keyboard
layout, installation type, network and proxy config, archive mirror config,
and storage config sections.

<figure>
<img src="{{site.baseurl}}/assets/utm_install.png">
</figure>

At the SSH configuration page, we do actually want to install OpenSSH, as it
will be the primary way we interact with the VM later on. There's no need to
touch anything else on the page besides ticking that box. I also skipped
installing any "featured snaps" that the installer recommended to me.

<figure>
<img src="{{site.baseurl}}/assets/utm_ssh.png">
</figure>

Finally, the installer starts installing the OS. Once it's done, it asked me to
reboot, which promptly makes the terminal window unresponsive. To get around it,
I manually "power cycled" the VM by closing the UTM window and relaunching.

<figure>
<img src="{{site.baseurl}}/assets/utm_reboot.png">
</figure>

After rebooting, the GRUB boot menu shows up again. This time, since we've
already installed the OS, we just need to launch it by selecting the "Boot from
next volume" option.
<figure>
<img src="{{site.baseurl}}/assets/utm_next.png">
</figure>

Login with the credentials we set up at install time, and we're in!

### 3. Configuring the dev environment
The default little terminal window is frankly a little hard to work with, so I
wanted to set up my vscode access ASAP. In the VM terminal, I launched the
OpenSSH daemon with

```
$ sudo systemctl enable --now ssh
```

and got the VM's IP address:

```
$ ip a
```

<figure>
<img src="{{site.baseurl}}/assets/utm_ip.png">
</figure>

I then set up the SSH host within the VM:

```
$ vim ~/.ssh/config
```

<figure>
<img src="{{site.baseurl}}/assets/utm_ssh_cfg.png">
</figure>

Finally, I was ready to connect my local vscode instance into the VM. With the
**Remote - SSH** extension from vscode, I selected "Connect to Host...", and
entered in my `ssh` command:

<figure>
<img src="{{site.baseurl}}/assets/utm_vscode.png">
</figure>

And we're in!

<figure>
<img src="{{site.baseurl}}/assets/utm_uname.png">
</figure>

For some extra quality of life, I installed the C/C++ extension pack within the
VM.

### 4. Running an eBPF program
Finally, I'm geared up to run my first eBPF program on my MacBook. Since I don't
know how to write eBPF yet, I'm using [libbpf-bootstrap](https://github.com/libbpf/libbpf-bootstrap){:target="_blank"}.
Fetching dependencies and compiling went without a hitch, following the README
on the repository:

```
$ sudo apt install build-essentials clang libelf1 libelf-dev zlib1g-dev
$ git clone --recurse-submodules https://github.com/libbpf/libbpf-bootstrap
$ git submodule update --init --recursive
$ cd examples/c
$ make
$ sudo ./bootstrap
```

For fun, I launched another shell, and ran some programs to see the BPF program
pick up on them in real time. Very cool!

<figure>
<img src="{{site.baseurl}}/assets/utm_cowsay.png">
<figcaption>Can't wait to play around more with this</figcaption>
</figure>
