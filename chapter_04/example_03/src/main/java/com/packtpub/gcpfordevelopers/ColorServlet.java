package com.packtpub.gcpfordevelopers;

import com.google.appengine.api.utils.SystemProperty;

import java.io.IOException;
import java.util.Properties;
import java.util.concurrent.ThreadLocalRandom;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.gson.Gson;

@WebServlet(name = "ColorServlet", value = "/colors")
public class ColorServlet extends HttpServlet {

  private int instance = ThreadLocalRandom.current().nextInt(0, Integer.MAX_VALUE);
  private Gson gson = new Gson();

  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response)
      throws IOException {
    
    ColorsResponse colorsResponse = new ColorsResponse();
    colorsResponse.setColor("red");
    colorsResponse.setProvider("Java 8 on App Engine standard environment");
    colorsResponse.setInstance(instance);

    response.setContentType("application/json");
    gson.toJson(colorsResponse, response.getWriter());
  }

}
